import "server-only";
import { eq } from "drizzle-orm";
import type { AuthAccount } from "@/lib/auth/auth-contract";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { AppError } from "../../errors";
import { type AuthEventType, logAuthEvent } from "../auth-events";
import type { ClientInfo } from "../client-info";
import { enforceLimit } from "../rate-limit";
import { createSession } from "../session";
import { type Tx, consumeChallenge } from "./challenge";
import { currentPlatformSettings } from "../../platform/settings";
import { LIMITS, OTP_PURPOSE, TERMS_VERSION, decideLogin } from "./otp-rules";
type Outcome =
  | { kind: "ok"; userId: string; created: boolean }
  | { kind: "invalid"; attemptsLeft: number }
  | { kind: "refused"; event: AuthEventType; userId?: string };

/** Finds the user or creates one (only after a correct code). Both run inside the locked transaction. */
async function signIn(tx: Tx, email: string, account: AuthAccount, now: Date): Promise<Outcome> {
  const [user] = await tx.select({ id: users.id, status: users.status }).from(users).where(eq(users.email, email));
  const decision = decideLogin(user?.status, (await currentPlatformSettings()).signupOpen, account.mode);
  if (decision !== "login" && decision !== "create") return { kind: "refused", event: decision, userId: user?.id };
  let userId = user?.id;
  if (!userId && account.mode === "register") {
    const { firstName, lastName } = account;
    const verified = { emailVerifiedAt: now, termsAcceptedAt: now, termsVersion: TERMS_VERSION, lastLoginAt: now };
    const [created] = await tx
      .insert(users)
      .values({ email, firstName, lastName, ...verified })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });
    if (created) return { kind: "ok", userId: created.id, created: true };
    // Another request created it first: use that row.
    [{ id: userId }] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email));
  }
  if (!userId) return { kind: "refused", event: "blocked_no_account" }; // unreachable: decideLogin refused it
  await tx.update(users).set({ lastLoginAt: now }).where(eq(users.id, userId));
  return { kind: "ok", userId, created: false };
}

/** Checks the login code (row locked, attempt stored), then signs in, all in one transaction. */
function checkCode(email: string, code: string, account: AuthAccount): Promise<Outcome> {
  return db.transaction(async (tx) => {
    const now = new Date();
    const result = await consumeChallenge(tx, email, code, OTP_PURPOSE, now);
    if (result.kind === "expired") return { kind: "refused", event: "otp_expired" };
    // Returned, not thrown: a throw would roll back the attempt count.
    if (result.kind === "invalid") return { kind: "invalid", attemptsLeft: result.attemptsLeft };
    return signIn(tx, email, account, now);
  });
}

/** Step 2 (PRD §4.1, §4.3): every refusal is a generic 410 expired; the real reason goes to auth_events. */
export async function verifyCode(input: {
  email: string;
  code: string;
  account: AuthAccount;
  emailHash: string;
  ipHash: string;
  client: ClientInfo;
}): Promise<{ created: boolean }> {
  const who = { emailHash: input.emailHash, ipHash: input.ipHash };
  await enforceLimit(`otp-verify:ip:${input.ipHash}`, LIMITS.verifyPerIp.limit, LIMITS.verifyPerIp.windowSeconds, who);
  const outcome = await checkCode(input.email, input.code, input.account);
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
