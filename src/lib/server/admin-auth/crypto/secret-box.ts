import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// TOTP secrets are encrypted, not hashed: the server needs the secret to compute codes (PRD §6).
// AES-256-GCM, random 12-byte IV per secret; stored as base64(iv | tag | ciphertext).

const IV_BYTES = 12;
const TAG_BYTES = 16;

export function seal(key: Buffer, plain: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
}

/** Throws when the key is wrong or the stored value was changed (GCM tag check). */
export function open(key: Buffer, sealed: string): Buffer {
  const data = Buffer.from(sealed, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, data.subarray(0, IV_BYTES));
  decipher.setAuthTag(data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
  return Buffer.concat([decipher.update(data.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]);
}
