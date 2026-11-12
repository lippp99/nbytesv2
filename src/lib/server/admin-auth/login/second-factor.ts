import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import type { SecondFactor } from "@/lib/admin-auth/admin-auth-contract";
import { authEnv } from "../../auth/auth-env";
import { hmac } from "../../auth/crypto";
import type { Tx } from "../../auth/otp/challenge";
import { emailKey } from "../../auth/request-guard";
import { db } from "../../db/client";
import { adminBackupCodes, adminLoginTickets, admins } from "../../db/schema";
import { AppError } from "../../errors";
import { attemptsLeftAfterMiss, canSignIn, ticketUsable } from "../admin-rules";
import { createAdminSession } from "../admin-session";
import { logAdminEvent } from "../audit";
import { newBackupCodes } from "../crypto/admin-codes";
import { open } from "../crypto/secret-box";
import { verifyTotp } from "../crypto/totp";
import { recordSecondFactorMiss } from "./lockout";
import { type TicketRow, clearTicketCookie, lockTicket, ticketTokenHash } from "./ticket";

// Step 3 (PRD §4, §6, §7): TOTP, a backup code, or the first TOTP of an enrollment, all on a valid login ticket.

type Match = { step: number | null; backup: boolean };
type Outcome =
  | { kind: "ok"; row: TicketRow; match: Match; backupCodes?: string[] }
  | { kind: "invalid"; row: TicketRow; attemptsLeft: number }
  | { kind: "expired" }
  | { kind: "invalid_input" };

/** The matching step (TOTP) or a burned backup code; null when the code is wrong. */
async function matchFactor(tx: Tx, row: TicketRow, factor: SecondFactor, now: Date): Promise<Match | null> {
  const { adminTotpKey, hashKey } = authEnv();
  const enrolled = row.admin.totpSecretEnc;
  if (factor.kind === "totp") {
    const sealed = enrolled ?? row.ticket.pendingSecretEnc!;
    const step = verifyTotp(open(adminTotpKey, sealed), factor.code, now.getTime(), enrolled ? row.admin.totpLastStep : null);
    return step === null ? null : { step, backup: false };
  }
  const [used] = await tx
    .update(adminBackupCodes)
    .set({ usedAt: now })
    .where(and(eq(adminBackupCodes.adminId, row.admin.id), eq(adminBackupCodes.codeHash, hmac(hashKey, factor.code)),
      isNull(adminBackupCodes.usedAt)))
    .returning({ id: adminBackupCodes.id });
  return used ? { step: null, backup: true } : null;
}

/** Correct code: ticket gone; an enrollment stores the secret, activates the admin and makes 10 backup codes. */
async function complete(tx: Tx, row: TicketRow, match: Match, now: Date): Promise<string[] | undefined> {
  await tx.delete(adminLoginTickets).where(eq(adminLoginTickets.id, row.ticket.id));
  const adminId = row.admin.id;
  if (row.admin.totpSecretEnc) {
    const step = match.step === null ? {} : { totpLastStep: match.step };
    await tx.update(admins).set({ lastLoginAt: now, ...step }).where(eq(admins.id, adminId));
    return undefined;
  }
  await tx
    .update(admins)
    .set({
      totpSecretEnc: row.ticket.pendingSecretEnc, totpLastStep: match.step, totpEnabledAt: now,
      status: "active", inviteExpiresAt: null, lastLoginAt: now,
    })
    .where(eq(admins.id, adminId));
  const codes = newBackupCodes();
  const { hashKey } = authEnv();
  await tx.delete(adminBackupCodes).where(eq(adminBackupCodes.adminId, adminId));
  await tx.insert(adminBackupCodes).values(codes.map((code) => ({ adminId, codeHash: hmac(hashKey, code) })));
  return codes;
}

function decide(tokenHash: string, factor: SecondFactor): Promise<Outcome> {
  return db.transaction(async (tx): Promise<Outcome> => {
    const now = new Date();
    const row = await lockTicket(tx, tokenHash);
    if (!row || !ticketUsable(row.ticket, now) || !canSignIn(row.admin, now)) return { kind: "expired" };
    // Enrollment takes only a TOTP, and only after /totp/enroll gave out the secret.
    if (!row.admin.totpSecretEnc && (factor.kind !== "totp" || !row.ticket.pendingSecretEnc)) return { kind: "invalid_input" };
    const match = await matchFactor(tx, row, factor, now);
    if (match) return { kind: "ok", row, match, backupCodes: await complete(tx, row, match, now) };
    const attemptsLeft = attemptsLeftAfterMiss(row.ticket.totpAttempts);
    if (attemptsLeft === 0) await tx.delete(adminLoginTickets).where(eq(adminLoginTickets.id, row.ticket.id));
    else await tx.update(adminLoginTickets).set({ totpAttempts: row.ticket.totpAttempts + 1 }).where(eq(adminLoginTickets.id, row.ticket.id));
    return { kind: "invalid", row, attemptsLeft };
  });
}

/** Checks the code; on success signs in (session cookie). Backup codes come back only right after an enrollment. */
export async function verifySecondFactor(
  factor: SecondFactor,
  ipHash: string,
  userAgent: string | null,
): Promise<{ backupCodes?: string[] }> {
  const tokenHash = await ticketTokenHash();
  const outcome = tokenHash ? await decide(tokenHash, factor) : ({ kind: "expired" } as const);
  if (outcome.kind === "invalid_input") throw new AppError("invalid_input", 400);
  if (outcome.kind === "expired") {
    await clearTicketCookie();
    throw new AppError("expired", 410);
  }
  const who = { adminId: outcome.row.admin.id, emailHash: emailKey(outcome.row.admin.email), ipHash };
  if (outcome.kind === "invalid") {
    await logAdminEvent("totp_failed", who);
    const locked = await recordSecondFactorMiss(outcome.row.admin.id, who);
    if (!locked && outcome.attemptsLeft > 0) throw new AppError("invalid", 401, { attemptsLeft: outcome.attemptsLeft });
    await clearTicketCookie();
    throw new AppError("expired", 410);
  }
  await clearTicketCookie();
  await createAdminSession(outcome.row.admin.id, userAgent);
  if (outcome.backupCodes) await logAdminEvent("totp_enrolled", who);
  if (outcome.match.backup) await logAdminEvent("backup_code_used", who);
  await logAdminEvent("login_success", who);
  return outcome.backupCodes ? { backupCodes: outcome.backupCodes } : {};
}
