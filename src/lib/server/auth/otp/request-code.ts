import "server-only";
import { eq } from "drizzle-orm";
import type { AuthMode } from "@/lib/auth/auth-contract";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { AppError } from "../../errors";
import { type AuthEventType, logAuthEvent } from "../auth-events";
import { enforceLimit, undoHit } from "../rate-limit";
import { dropChallenge, issueChallenge } from "./challenge";
import { sendAuthEmail } from "./mailer";
import { type EmailKind, LIMITS, SIGNUP_OPEN, decideEmail, emailGetsCode } from "./otp-rules";

const EVENT: Record<EmailKind, AuthEventType> = {
  signup: "otp_requested",
  login: "otp_requested",
  suspended: "blocked_suspended",
  signup_closed: "blocked_signup_closed",
  no_account: "blocked_no_account",
  delete_account: "delete_code_requested", // sent by account/delete-account.ts, never by this flow
};

/**
 * Step 1 (PRD §4.1): rate limits, then the email that fits the account. Whatever the account state, the caller
 * answers the same 202, so nothing here may change the response except limits and provider failure.
 */
export async function requestCode(email: string, mode: AuthMode, emailHash: string, ipHash: string): Promise<void> {
  const who = { emailHash, ipHash };
  const cooldownKey = `otp-send:cooldown:${emailHash}`;
  await enforceLimit(`otp-send:ip:${ipHash}`, LIMITS.sendPerIp.limit, LIMITS.sendPerIp.windowSeconds, who);
  await enforceLimit(cooldownKey, LIMITS.sendCooldownPerEmail.limit, LIMITS.sendCooldownPerEmail.windowSeconds, who);
  await enforceLimit(`otp-send:email:${emailHash}`, LIMITS.sendPerEmail.limit, LIMITS.sendPerEmail.windowSeconds, who);

  const [user] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.email, email));
  const kind = decideEmail(user?.status, SIGNUP_OPEN, mode);
  const code = emailGetsCode(kind) ? await issueChallenge(email) : undefined;
  try {
    await sendAuthEmail(email, kind, code);
  } catch (error) {
    // The code never reached the user: drop it and do not count the cooldown.
    if (code) await dropChallenge(email);
    await undoHit(cooldownKey, LIMITS.sendCooldownPerEmail.windowSeconds);
    await logAuthEvent("otp_send_failed", { ...who, userId: user?.id });
    throw new AppError("unavailable", 503, {}, undefined, { cause: error });
  }
  await logAuthEvent(EVENT[kind], { ...who, userId: user?.id });
}
