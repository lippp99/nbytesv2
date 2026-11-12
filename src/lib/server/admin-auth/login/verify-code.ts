import "server-only";
import { eq } from "drizzle-orm";
import { consumeChallenge } from "../../auth/otp/challenge";
import { db } from "../../db/client";
import { admins } from "../../db/schema";
import { AppError } from "../../errors";
import { ADMIN_CODE_PURPOSE, ADMIN_LIMITS, canSignIn } from "../admin-rules";
import { logAdminEvent } from "../audit";
import { enforceAdminLimit } from "./request-code";
import { createTicket } from "./ticket";

type Outcome =
  | { kind: "ok"; adminId: string; enrolled: boolean }
  | { kind: "invalid"; attemptsLeft: number }
  | { kind: "expired" };

/** Code attempt (row locked, attempt stored) and the admin check, in one transaction. Returned, never thrown. */
function checkCode(email: string, code: string): Promise<Outcome> {
  return db.transaction(async (tx): Promise<Outcome> => {
    const now = new Date();
    const result = await consumeChallenge(tx, email, code, ADMIN_CODE_PURPOSE, now);
    if (result.kind !== "ok") return result;
    const [admin] = await tx
      .select({
        id: admins.id, status: admins.status, inviteExpiresAt: admins.inviteExpiresAt,
        lockedUntil: admins.lockedUntil, totpSecretEnc: admins.totpSecretEnc,
      })
      .from(admins)
      .where(eq(admins.email, email));
    // Disabled, expired or locked since the code was sent.
    if (!admin || !canSignIn(admin, now)) return { kind: "expired" };
    return { kind: "ok", adminId: admin.id, enrolled: !!admin.totpSecretEnc };
  });
}

/** Step 2 (PRD §4): correct code -> login ticket cookie, and whether step 3 is TOTP or enrollment. */
export async function verifyAdminCode(input: {
  email: string;
  code: string;
  emailHash: string;
  ipHash: string;
}): Promise<{ next: "totp" | "enroll" }> {
  const who = { emailHash: input.emailHash, ipHash: input.ipHash };
  await enforceAdminLimit(`admin-code-verify:ip:${input.ipHash}`, ADMIN_LIMITS.verifyPerIp);
  const outcome = await checkCode(input.email, input.code);
  if (outcome.kind === "invalid") {
    await logAdminEvent("code_failed", who);
    if (outcome.attemptsLeft === 0) throw new AppError("expired", 410);
    throw new AppError("invalid", 401, { attemptsLeft: outcome.attemptsLeft });
  }
  if (outcome.kind === "expired") throw new AppError("expired", 410);
  await createTicket(outcome.adminId);
  return { next: outcome.enrolled ? "totp" : "enroll" };
}
