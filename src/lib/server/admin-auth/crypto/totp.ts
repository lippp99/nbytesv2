import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// TOTP per RFC 6238 on HOTP (RFC 4226): HMAC-SHA1, 30 s steps, 6 digits, ±1 step (PRD backend-auth-admin §6).

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;
const ISSUER = "nbytes Admin";

/** RFC 4648 base32 without padding, as authenticator apps expect it. */
export function base32Encode(bytes: Buffer): string {
  let out = "";
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = ((value << 8) | byte) & 0xffff; // never more than 12 bits are pending
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return bits > 0 ? out + BASE32[(value << (5 - bits)) & 31] : out;
}

/** Inverse of base32Encode; ignores case, spaces and "=" padding, throws on any other character. */
export function base32Decode(text: string): Buffer {
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of text.toUpperCase().replace(/[\s=]/g, "")) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 character");
    value = ((value << 5) | index) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** HOTP value for one counter (RFC 4226 §5.3, dynamic truncation). */
export function hotp(key: Buffer, counter: number, digits = DIGITS): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hash = createHmac("sha1", key).update(message).digest();
  const offset = hash[hash.length - 1] & 0x0f;
  const binary = hash.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export const timeStep = (nowMs: number) => Math.floor(nowMs / 1000 / STEP_SECONDS);

/**
 * The step a code belongs to (current ±1), or null. Steps at or before `lastStep` are refused, so a code that already
 * signed someone in never works again (anti-replay, PRD §6).
 */
export function verifyTotp(key: Buffer, code: string, nowMs: number, lastStep: number | null): number | null {
  const current = timeStep(nowMs);
  const given = Buffer.from(code);
  for (const step of [current - 1, current, current + 1]) {
    if (lastStep !== null && step <= lastStep) continue;
    const expected = Buffer.from(hotp(key, step));
    if (expected.length === given.length && timingSafeEqual(expected, given)) return step;
  }
  return null;
}

/** 20 random bytes (160 bits, the length RFC 4226 recommends). */
export const newTotpSecret = () => randomBytes(20);

/** Key URI for authenticator apps (PRD §7): otpauth://totp/nbytes%20Admin:<email>?secret=…&issuer=nbytes%20Admin */
export function otpauthUrl(email: string, secretBase32: string): string {
  const issuer = encodeURIComponent(ISSUER);
  return `otpauth://totp/${issuer}:${encodeURIComponent(email)}?secret=${secretBase32}&issuer=${issuer}`;
}
