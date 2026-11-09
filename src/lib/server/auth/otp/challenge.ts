import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { otpChallenges } from "../../db/schema";
import { authEnv } from "../auth-env";
import { equalHex, hmac, randomOtp } from "../crypto";
import { type AttemptResult, OTP_PURPOSE, OTP_TTL_MS, judgeAttempt } from "./otp-rules";

// Email codes, shared by login ("user-login") and account deletion ("account-delete"). The purpose is part of the
// hash and of every lookup, so a code made for one purpose never works for the other.

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Stored form of a code: keyed by the pepper, bound to the purpose and the email. */
export const otpHash = (email: string, code: string, purpose = OTP_PURPOSE) =>
  hmac(authEnv().otpPepper, `${purpose}:${email}:${code}`);

const sameEmail = (email: string, purpose: string) =>
  and(eq(otpChallenges.email, email), eq(otpChallenges.purpose, purpose));

/** New code for this email and purpose; any older code of the same pair stops working. */
export async function issueChallenge(email: string, purpose = OTP_PURPOSE): Promise<string> {
  const code = randomOtp();
  await db.transaction(async (tx) => {
    await tx.delete(otpChallenges).where(sameEmail(email, purpose));
    await tx.insert(otpChallenges).values({
      email,
      purpose,
      codeHash: otpHash(email, code, purpose),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
  });
  return code;
}

/** Drops the pair's code (the email carrying it was never sent). */
export async function dropChallenge(email: string, purpose = OTP_PURPOSE): Promise<void> {
  await db.delete(otpChallenges).where(sameEmail(email, purpose));
}

/**
 * One attempt at the pair's latest code, inside the caller's transaction. The row is locked so parallel guesses
 * cannot pass the 5-attempt limit or use one code twice; the attempt is stored before the caller acts on it.
 */
export async function consumeChallenge(tx: Tx, email: string, code: string, purpose: string, now: Date): Promise<AttemptResult> {
  const [challenge] = await tx
    .select()
    .from(otpChallenges)
    .where(sameEmail(email, purpose))
    .orderBy(desc(otpChallenges.createdAt))
    .limit(1)
    .for("update");
  const matches = challenge ? equalHex(challenge.codeHash, otpHash(email, code, purpose)) : false;
  const result = judgeAttempt(challenge, matches, now);
  if (result.kind === "expired") return result;
  await tx
    .update(otpChallenges)
    .set({ attempts: challenge.attempts + 1, consumedAt: result.kind === "ok" ? now : null })
    .where(eq(otpChallenges.id, challenge.id));
  return result;
}
