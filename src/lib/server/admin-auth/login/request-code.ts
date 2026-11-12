import "server-only";
import { eq } from "drizzle-orm";
import { logServerError } from "../../auth/request-guard";
import { hit, undoHit } from "../../auth/rate-limit";
import { dropChallenge, issueChallenge } from "../../auth/otp/challenge";
import { sendAuthEmail } from "../../auth/otp/mailer";
import { db } from "../../db/client";
import { admins } from "../../db/schema";
import { rateLimitedError } from "../../errors";
import { ADMIN_CODE_PURPOSE, ADMIN_LIMITS, canSignIn } from "../admin-rules";
import { logAdminEvent } from "../audit";
import { randomAdminCode } from "../crypto/admin-codes";

type Rule = { limit: number; windowSeconds: number };

/** Rate limit on the shared table; admin keys start with "admin-" (PRD §11). Over the limit -> 429. */
export async function enforceAdminLimit(key: string, rule: Rule): Promise<void> {
  const wait = await hit(key, rule.limit, rule.windowSeconds);
  if (wait) throw rateLimitedError(wait);
}

/**
 * Step 1 (PRD §4, §5, §16a): a 10-digit code only for an admin who may sign in; anyone else gets nothing. The caller
 * always answers the same 202, so only rate limits may change the response. A failed send is logged, not answered
 * with an error: a 503 would only ever happen for admin emails and so reveal who is an admin.
 */
export async function requestAdminCode(email: string, emailHash: string, ipHash: string): Promise<void> {
  const cooldownKey = `admin-code-send:cooldown:${emailHash}`;
  await enforceAdminLimit(`admin-code-send:ip:${ipHash}`, ADMIN_LIMITS.sendPerIp);
  await enforceAdminLimit(cooldownKey, ADMIN_LIMITS.sendCooldownPerEmail);
  await enforceAdminLimit(`admin-code-send:email:${emailHash}`, ADMIN_LIMITS.sendPerEmail);

  const [admin] = await db
    .select({ id: admins.id, status: admins.status, inviteExpiresAt: admins.inviteExpiresAt, lockedUntil: admins.lockedUntil })
    .from(admins)
    .where(eq(admins.email, email));
  if (!admin || !canSignIn(admin, new Date())) return;

  const code = await issueChallenge(email, ADMIN_CODE_PURPOSE, randomAdminCode);
  const who = { adminId: admin.id, emailHash, ipHash };
  try {
    await sendAuthEmail(email, "admin_login", code);
  } catch (error) {
    logServerError(error);
    await dropChallenge(email, ADMIN_CODE_PURPOSE);
    await undoHit(cooldownKey, ADMIN_LIMITS.sendCooldownPerEmail.windowSeconds);
    await logAdminEvent("code_send_failed", who);
    return;
  }
  await logAdminEvent("code_sent", who);
}
