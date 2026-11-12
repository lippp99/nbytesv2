import "server-only";

// Pure rules of the admin login (PRD backend-auth-admin §4–§11, §16a), kept apart from the DB for tests.

export const ADMIN_CODE_PURPOSE = "admin-login"; // otp_challenges.purpose and the hash prefix
export const TICKET_TTL_MS = 10 * 60 * 1000;
export const TOTP_MAX_ATTEMPTS = 5; // per ticket
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_TOUCH_MS = 60 * 1000;
export const INVITE_TTL_MS = 72 * 60 * 60 * 1000; // C4
export const LOCK_MS = 60 * 60 * 1000; // C3
export const LOCK_AFTER_FAILS = 10; // C3: wrong TOTP/backup codes per admin per hour
export const CODE_RESEND_SECONDS = 60;

export const ADMIN_LIMITS = {
  sendPerIp: { limit: 20, windowSeconds: 3600 },
  sendCooldownPerEmail: { limit: 1, windowSeconds: CODE_RESEND_SECONDS },
  sendPerEmail: { limit: 5, windowSeconds: 3600 },
  verifyPerIp: { limit: 30, windowSeconds: 3600 },
  totpFailsPerAdmin: { limit: LOCK_AFTER_FAILS - 1, windowSeconds: 3600 }, // hit() trips on count > limit, i.e. the 10th
} as const;

export type AdminStatus = "invited" | "active";
type LoginState = { status: AdminStatus; inviteExpiresAt: Date | null; lockedUntil: Date | null };

export const isLocked = (admin: { lockedUntil: Date | null }, now: Date) => !!admin.lockedUntil && admin.lockedUntil > now;

/** §16a: active, or invited with a live invite (first login); never an expired invite or a locked login (C3). */
export function canSignIn(admin: LoginState | undefined, now: Date): boolean {
  if (!admin || isLocked(admin, now)) return false;
  if (admin.status === "active") return true;
  return admin.status === "invited" && !!admin.inviteExpiresAt && admin.inviteExpiresAt > now;
}

/** A ticket allows step 3 while it is fresh and has TOTP attempts left. */
export const ticketUsable = (ticket: { totpAttempts: number; expiresAt: Date } | undefined, now: Date) =>
  !!ticket && ticket.expiresAt > now && ticket.totpAttempts < TOTP_MAX_ATTEMPTS;

/** Attempts left after one more wrong code on this ticket; 0 means the ticket is spent. */
export const attemptsLeftAfterMiss = (totpAttempts: number) => Math.max(0, TOTP_MAX_ATTEMPTS - (totpAttempts + 1));

type SessionState = { expiresAt: Date; lastSeenAt: Date; status: AdminStatus; totpEnabled: boolean };

/** §8: refused when expired, idle too long, admin not active, or TOTP not set up. */
export const sessionAlive = (s: SessionState, now: number) =>
  s.expiresAt.getTime() > now && s.lastSeenAt.getTime() + SESSION_IDLE_MS > now && s.status === "active" && s.totpEnabled;
