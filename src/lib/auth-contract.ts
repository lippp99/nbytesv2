// Validation shared by the login form now and the OTP API later (PRD §6.2).
export const OTP_LENGTH = 8;
export const EMAIL_MAX_LENGTH = 254;
export const OTP_MAX_ATTEMPTS = 5;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = new RegExp(`^\\d{${OTP_LENGTH}}$`);

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email);
}

/** Drops every non-digit (spaces, dashes from "1234-5678") and caps at 8 digits. */
export function sanitizeOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function isValidOtp(value: string): boolean {
  return OTP_PATTERN.test(value);
}

/** "andi@domain.com" -> "a***@domain.com" */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  return `${email[0]}***${email.slice(at)}`;
}
