import "server-only";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const OTP_DIGITS = 8; // = OTP_LENGTH in auth-contract

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export const hmac = (key: Buffer, value: string) => createHmac("sha256", key).update(value).digest("hex");

/** 8 digits from the CSPRNG, leading zeros kept. */
export const randomOtp = () => String(randomInt(0, 10 ** OTP_DIGITS)).padStart(OTP_DIGITS, "0");

/** 32 random bytes for a session cookie. */
export const randomToken = () => randomBytes(32).toString("base64url");

/** Constant-time compare of two hex digests. */
export function equalHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
