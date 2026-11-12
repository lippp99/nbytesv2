import "server-only";
import { randomInt } from "node:crypto";
import { BACKUP_CODE_ALPHABET, BACKUP_CODE_LENGTH } from "../../../admin-auth/admin-auth-contract.ts";

const EMAIL_CODE_DIGITS = 10; // = ADMIN_OTP_LENGTH
const BACKUP_CODE_COUNT = 10;

/** 10 digits from the CSPRNG, leading zeros kept (PRD §5; randomInt accepts this range). */
export const randomAdminCode = () => String(randomInt(0, 10 ** EMAIL_CODE_DIGITS)).padStart(EMAIL_CODE_DIGITS, "0");

const backupCode = () =>
  Array.from({ length: BACKUP_CODE_LENGTH }, () => BACKUP_CODE_ALPHABET[randomInt(BACKUP_CODE_ALPHABET.length)]).join("");

/** 10 one-time backup codes (C7), unformatted; the UI shows them 5-5. */
export function newBackupCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < BACKUP_CODE_COUNT) codes.add(backupCode());
  return [...codes];
}
