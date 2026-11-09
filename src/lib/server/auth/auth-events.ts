import "server-only";
import { db } from "../db/client";
import { authEvents } from "../db/schema";

export type AuthEventType =
  | "otp_requested"
  | "otp_send_failed"
  | "otp_failed"
  | "otp_expired"
  | "login_success"
  | "account_created"
  | "logout"
  | "blocked_suspended"
  | "blocked_signup_closed"
  | "blocked_no_account"
  | "rate_limited"
  | "session_revoked"
  | "sessions_revoked_others"
  | "profile_updated"
  | "delete_code_requested"
  | "account_deleted";

/** Audit trail with hashed email and IP only (`emailHash` / `ipHash` come from request-guard). */
export async function logAuthEvent(
  type: AuthEventType,
  who: { emailHash: string; ipHash?: string; userId?: string },
): Promise<void> {
  await db.insert(authEvents).values({ type, emailHash: who.emailHash, ipHash: who.ipHash, userId: who.userId });
}
