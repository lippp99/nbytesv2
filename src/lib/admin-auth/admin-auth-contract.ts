// Validation shared by the admin login form, the admin console and the admin auth API (PRD backend-auth-admin §12).
// Relative ".ts" import (not "@/") so `node --test` can load this file directly.
import { isValidEmail, normalizeEmail } from "../auth/auth-contract.ts";

export const ADMIN_OTP_LENGTH = 10;
export const TOTP_LENGTH = 6;

/** Keeps digits only (drops spaces, dashes from "12345-67890") and caps at `length`. */
export function sanitizeDigits(value: string, length: number): string {
  return value.replace(/\D/g, "").slice(0, length);
}

export function isDigits(value: string, length: number): boolean {
  return value.length === length && /^\d+$/.test(value);
}

// --- Backup codes (C7): 10 letters/digits without look-alikes (no 0/O, 1/I/l; upper case only), shown 5-5.

export const BACKUP_CODE_LENGTH = 10;
export const BACKUP_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const BACKUP_PATTERN = new RegExp(`^[${BACKUP_CODE_ALPHABET}]{${BACKUP_CODE_LENGTH}}$`);

/** "abcde-fghjk" / "ABCDE FGHJK" -> "ABCDEFGHJK"; anything that is not a backup code -> null. */
export function normalizeBackupCode(value: string): string | null {
  const code = value.toUpperCase().replace(/[\s-]/g, "");
  return BACKUP_PATTERN.test(code) ? code : null;
}

export const formatBackupCode = (code: string) => `${code.slice(0, 5)}-${code.slice(5)}`;

// --- Cookies (PRD §8, §16a). `__Host-` forces Secure + Path=/ + no Domain; plain names only for the http dev server.

const devName = (name: string) => (process.env.NODE_ENV === "development" ? name : `__Host-${name}`);
export const adminSessionCookieName = () => devName("nb_admin_session");
export const adminTicketCookieName = () => devName("nb_admin_ticket");

// --- API bodies (PRD §12). Each parser reads only its own fields (no mass assignment).

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const emailOf = (json: Record<string, unknown>) =>
  typeof json.email === "string" && isValidEmail(json.email) ? normalizeEmail(json.email) : null;

export function parseAdminEmailBody(json: unknown): { email: string } | null {
  const email = isRecord(json) ? emailOf(json) : null;
  return email ? { email } : null;
}

export function parseAdminCodeBody(json: unknown): { email: string; code: string } | null {
  if (!isRecord(json) || typeof json.code !== "string" || !isDigits(json.code, ADMIN_OTP_LENGTH)) return null;
  const email = emailOf(json);
  return email ? { email, code: json.code } : null;
}

export type SecondFactor = { kind: "totp"; code: string } | { kind: "backup"; code: string };

/** Step 3 accepts a 6-digit authenticator code or one backup code. */
export function parseSecondFactorBody(json: unknown): SecondFactor | null {
  if (!isRecord(json) || typeof json.code !== "string") return null;
  if (isDigits(json.code, TOTP_LENGTH)) return { kind: "totp", code: json.code };
  const backup = normalizeBackupCode(json.code);
  return backup ? { kind: "backup", code: backup } : null;
}

// --- What the console shows about the signed-in admin (no secrets, no hashes). One Owner, no roles (owner, 2026-11-11).

export type AdminMe = { id: string; email: string; name: string | null };
