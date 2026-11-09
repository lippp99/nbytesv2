import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { otpChallenges, users } from "../../db/schema";
import { AppError } from "../../errors";
import { type AuthEventType, logAuthEvent } from "../auth-events";
import type { ClientInfo } from "../client-info";
import { equalHex } from "../crypto";
import { enforceLimit } from "../rate-limit";
import { createSession } from "../session";
import { LIMITS, OTP_PURPOSE, SIGNUP_OPEN, TERMS_VERSION, decideLogin, judgeAttempt } from "./otp-rules";
import { otpHash } from "./request-code";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Outcome =
  | { kind: "ok"; userId: string; created: boolean }
  | { kind: "invalid"; attemptsLeft: number }
  | { kind: "refused"; event: AuthEventType; userId?: string };

/** Finds the user or creates one (only after a correct code). Both run inside the locked transaction. */
async function signIn(tx: Tx, email: string, now: Date): Promise<Outcome> {
  const [user] = await tx.select({ id: users.id, status: users.status }).from(users).where(eq(users.email, email));
  const decision = decideLogin(user?.status, SIGNUP_OPEN);
  if (decision === "blocked_suspended" || decision === "blocked_signup_closed") {
    return { kind: "refused", event: decision, userId: user?.id };
  }
  let userId = user?.id;
  if (!userId) {
    const [created] = await tx
      .insert(users)
      .values({ email, emailVerifiedAt: now, termsAcceptedAt: now, termsVersion: TERMS_VERSION, lastLoginAt: now })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });
    if (created) return { kind: "ok", userId: created.id, created: true };
    // Another request created it first: use that row.
    [{ id: userId }] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email));
  }
  await tx.update(users).set({ lastLoginAt: now }).where(eq(users.id, userId));
  return { kind: "ok", userId, created: false };
}

/** Locks the email's code row so parallel guesses cannot pass the 5-attempt limit or use one code twice. */
function checkCode(email: string, code: string): Promise<Outcome> {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [challenge] = await tx
      .select()
      .from(otpChallenges)
      .where(and(eq(otpChallenges.email, email), eq(otpChallenges.purpose, OTP_PURPOSE)))
      .orderBy(desc(otpChallenges.createdAt))
      .limit(1)
      .for("update");
    const matches = challenge ? equalHex(challenge.codeHash, otpHash(email, code)) : false;
    const result = judgeAttempt(challenge, matches, now);
    if (result.kind === "expired") return { kind: "refused", event: "otp_expired" };
    await tx
      .update(otpChallenges)
      .set({ attempts: challenge.attempts + 1, consumedAt: result.kind === "ok" ? now : null })
      .where(eq(otpChallenges.id, challenge.id));
    // Returned, not thrown: a throw would roll back the attempt count.
    if (result.kind === "invalid") return { kind: "invalid", attemptsLeft: result.attemptsLeft };
    return signIn(tx, email, now);
  });
}

/** Step 2 (PRD §4.1, §4.3): every refusal is a generic 410 expired; the real reason goes to auth_events. */
export async function verifyCode(input: {
  email: string;
  code: string;
  emailHash: string;
  ipHash: string;
  client: ClientInfo;
}): Promise<{ created: boolean }> {
  const who = { emailHash: input.emailHash, ipHash: input.ipHash };
  await enforceLimit(`otp-verify:ip:${input.ipHash}`, LIMITS.verifyPerIp.limit, LIMITS.verifyPerIp.windowSeconds, who);
  const outcome = await checkCode(input.email, input.code);
  if (outcome.kind === "invalid") {
    await logAuthEvent("otp_failed", who);
    if (outcome.attemptsLeft === 0) throw new AppError("expired", 410);
    throw new AppError("invalid", 401, { attemptsLeft: outcome.attemptsLeft });
  }
  if (outcome.kind === "refused") {
    await logAuthEvent(outcome.event, { ...who, userId: outcome.userId });
    throw new AppError("expired", 410);
  }
  await createSession(outcome.userId, input.client);
  if (outcome.created) await logAuthEvent("account_created", { ...who, userId: outcome.userId });
  await logAuthEvent("login_success", { ...who, userId: outcome.userId });
  return { created: outcome.created };
}
