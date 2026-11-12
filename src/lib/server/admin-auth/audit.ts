import "server-only";
import { requestIpMasked } from "../auth/request-guard";
import { db } from "../db/client";
import { adminAuditEvents } from "../db/schema";

// PRD backend-auth-admin §13: append-only (insert only), email and IP as HMAC. Never codes, secrets or tokens.
export type AdminAuditType =
  | "code_sent"
  | "code_send_failed"
  | "code_failed"
  | "totp_failed"
  | "login_success"
  | "logout"
  | "totp_enrolled"
  | "backup_code_used"
  | "invited"
  | "locked"
  | "exchange_rate_set"
  | "model_price_set"
  | "model_disabled"
  | "user_suspended"
  | "user_restored";

export type AuditWho = { adminId?: string; emailHash?: string; ipHash?: string };
type Writer = Pick<typeof db, "insert">;

/** One audit row; pass a transaction as `writer` when the action and its row must commit together. */
export async function logAdminEvent(
  type: AdminAuditType, who: AuditWho, extra: { target?: string; reason?: string } = {}, writer: Writer = db,
): Promise<void> {
  await writer.insert(adminAuditEvents).values({ type, ...who, ...extra, ipMasked: await requestIpMasked() });
}
