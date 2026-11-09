import "server-only";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { otpChallenges, users } from "../db/schema";
import { AppError } from "../errors";
import { logAuthEvent } from "../auth/auth-events";
import { consumeChallenge, dropChallenge, issueChallenge } from "../auth/otp/challenge";
import { sendAuthEmail } from "../auth/otp/mailer";
import { DELETE_PURPOSE, LIMITS, OTP_RESEND_SECONDS } from "../auth/otp/otp-rules";
import { enforceLimit, undoHit } from "../auth/rate-limit";
import { emailKey } from "../auth/request-guard";
import type { SessionUser } from "../auth/session";

// Account deletion (PRD account-settings §12). The code always goes to the session's own email, never to an address
// from the request, and only the session's own user row is deleted.

const who = (user: SessionUser, ipHash: string) => ({ emailHash: emailKey(user.email), ipHash, userId: user.id });

/** Step 1: emails a deletion code to the account's address. */
export async function requestDeleteCode(user: SessionUser, ipHash: string): Promise<void> {
  const actor = who(user, ipHash);
  const cooldownKey = `delete-send:cooldown:${user.id}`;
  await enforceLimit(cooldownKey, 1, OTP_RESEND_SECONDS, actor);
  const { limit, windowSeconds } = LIMITS.deleteSendPerUser;
  await enforceLimit(`delete-send:user:${user.id}`, limit, windowSeconds, actor);
  const code = await issueChallenge(user.email, DELETE_PURPOSE);
  try {
    await sendAuthEmail(user.email, "delete_account", code);
  } catch (error) {
    // The code never reached the user: drop it and do not count the cooldown.
    await dropChallenge(user.email, DELETE_PURPOSE);
    await undoHit(cooldownKey, OTP_RESEND_SECONDS);
    throw new AppError("unavailable", 503, {}, undefined, { cause: error });
  }
  await logAuthEvent("delete_code_requested", actor);
}

/**
 * Step 2: checks the code and deletes the user in one transaction. Sessions go with the row (ON DELETE CASCADE);
 * auth_events keep their hashes with user_id set to NULL. Every refusal is a 401 invalid or a generic 410 expired.
 */
export async function deleteAccount(user: SessionUser, code: string, ipHash: string): Promise<void> {
  const actor = who(user, ipHash);
  const { limit, windowSeconds } = LIMITS.verifyPerIp;
  await enforceLimit(`otp-verify:ip:${ipHash}`, limit, windowSeconds, actor);
  const result = await db.transaction(async (tx) => {
    const attempt = await consumeChallenge(tx, user.email, code, DELETE_PURPOSE, new Date());
    if (attempt.kind !== "ok") return attempt; // returned, not thrown: a throw would roll back the attempt count
    await tx.delete(otpChallenges).where(eq(otpChallenges.email, user.email));
    await tx.delete(users).where(eq(users.id, user.id));
    return attempt;
  });
  if (result.kind === "invalid") {
    await logAuthEvent("otp_failed", actor);
    if (result.attemptsLeft === 0) throw new AppError("expired", 410);
    throw new AppError("invalid", 401, { attemptsLeft: result.attemptsLeft });
  }
  if (result.kind === "expired") {
    await logAuthEvent("otp_expired", actor);
    throw new AppError("expired", 410);
  }
  // The user row is gone, so the event keeps only the hashes.
  await logAuthEvent("account_deleted", { emailHash: actor.emailHash, ipHash });
}
