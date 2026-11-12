import "server-only";
import { eq } from "drizzle-orm";
import { logServerError } from "../../auth/request-guard";
import { hit } from "../../auth/rate-limit";
import { sendAuthEmail } from "../../auth/otp/mailer";
import { db } from "../../db/client";
import { adminLoginTickets, admins } from "../../db/schema";
import { ADMIN_LIMITS, LOCK_MS } from "../admin-rules";
import { type AuditWho, logAdminEvent } from "../audit";

/** Mails the Owner (§16a; every active admin is the Owner). A failed send is logged and never blocks the lock. */
async function notifyOwners(): Promise<void> {
  const owners = await db.select({ email: admins.email }).from(admins).where(eq(admins.status, "active"));
  const sent = await Promise.allSettled(owners.map((owner) => sendAuthEmail(owner.email, "admin_locked")));
  for (const result of sent) if (result.status === "rejected") logServerError(result.reason);
}

/**
 * C3: counts one wrong TOTP/backup code for this admin; the 10th within the hour locks their login for 1 hour,
 * drops their open login tickets and emails the Owner. Returns whether this miss locked the admin.
 */
export async function recordSecondFactorMiss(adminId: string, who: AuditWho): Promise<boolean> {
  const rule = ADMIN_LIMITS.totpFailsPerAdmin;
  if (!(await hit(`admin-totp-fail:${adminId}`, rule.limit, rule.windowSeconds))) return false;
  await db.update(admins).set({ lockedUntil: new Date(Date.now() + LOCK_MS) }).where(eq(admins.id, adminId));
  await db.delete(adminLoginTickets).where(eq(adminLoginTickets.adminId, adminId));
  await logAdminEvent("locked", { ...who, adminId });
  await notifyOwners();
  return true;
}
