// Validation shared by the admin login form now and the admin auth API later (PRD admin-console §2.1).
export const ADMIN_OTP_LENGTH = 10;
export const TOTP_LENGTH = 6;

/** Keeps digits only (drops spaces, dashes from "12345-67890") and caps at `length`. */
export function sanitizeDigits(value: string, length: number): string {
  return value.replace(/\D/g, "").slice(0, length);
}

export function isDigits(value: string, length: number): boolean {
  return value.length === length && /^\d+$/.test(value);
}
