import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { otpChallenges, users } from "../../db/schema";
import { AppError } from "../../errors";
import { authEnv } from "../auth-env";
import { logAuthEvent } from "../auth-events";
import { hmac, randomOtp } from "../crypto";
import { enforceLimit, undoHit } from "../rate-limit";
import { sendAuthEmail } from "./mailer";
import { LIMITS, OTP_PURPOSE, OTP_TTL_MS, SIGNUP_OPEN, decideEmail, emailGetsCode } from "./otp-rules";

/** Stored form of a code: keyed by the pepper, bound to the purpose and the email. */
export const otpHash = (email: string, code: string) => hmac(authEnv().otpPepper, `${OTP_PURPOSE}:${email}:${code}`);

const sameEmail = (email: string) => and(eq(otpChallenges.email, email), eq(otpChallenges.purpose, OTP_PURPOSE));

/** New code for this email; any older code of the email stops working. */
async function issueChallenge(email: string): Promise<string> {
  const code = randomOtp();
  await db.transaction(async (tx) => {
    await tx.delete(otpChallenges).where(sameEmail(email));
    await tx.insert(otpChallenges).values({
      email,
      purpose: OTP_PURPOSE,
      codeHash: otpHash(email, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
  });
  return code;
}

/**
 * Step 1 (PRD §4.1): rate limits, then the email that fits the account. Whatever the account state, the caller
 * answers the same 202, so nothing here may change the response except limits and provider failure.
 */
export async function requestCode(email: string, emailHash: string, ipHash: string): Promise<void> {
  const who = { emailHash, ipHash };
  const cooldownKey = `otp-send:cooldown:${emailHash}`;
  await enforceLimit(`otp-send:ip:${ipHash}`, LIMITS.sendPerIp.limit, LIMITS.sendPerIp.windowSeconds, who);
  await enforceLimit(cooldownKey, LIMITS.sendCooldownPerEmail.limit, LIMITS.sendCooldownPerEmail.windowSeconds, who);
  await enforceLimit(`otp-send:email:${emailHash}`, LIMITS.sendPerEmail.limit, LIMITS.sendPerEmail.windowSeconds, who);

  const [user] = await db.select({ id: users.id, status: users.status }).from(users).where(eq(users.email, email));
  const kind = decideEmail(user?.status, SIGNUP_OPEN);
  const code = emailGetsCode(kind) ? await issueChallenge(email) : undefined;
  try {
    await sendAuthEmail(email, kind, code);
  } catch (error) {
    // The code never reached the user: drop it and do not count the cooldown.
    if (code) await db.delete(otpChallenges).where(sameEmail(email));
    await undoHit(cooldownKey, LIMITS.sendCooldownPerEmail.windowSeconds);
    await logAuthEvent("otp_send_failed", { ...who, userId: user?.id });
    throw new AppError("unavailable", 503, {}, undefined, { cause: error });
  }
  const type = kind === "suspended" ? "blocked_suspended" : kind === "signup_closed" ? "blocked_signup_closed" : "otp_requested";
  await logAuthEvent(type, { ...who, userId: user?.id });
}
