import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Sumopod webhook signature (svix scheme, PRD gateway-pricing-billing §6.3 [P9]): HMAC-SHA256 with the base64 secret
// after "whsec_", over "{svix-id}.{svix-timestamp}.{rawBody}", base64. The header may hold several "v1,<sig>" values
// separated by spaces (about 24 h after a secret rotation). Added by nbytes: constant-time compare, timestamp window.

/** Technical choice left open by the PRD: 5 minutes either way, the svix library default. */
export const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

export type SvixHeaders = { id: string; timestamp: string; signature: string };

export function signSvix(secret: string, id: string, timestamp: string, rawBody: string): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  return createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
}

/** True only for a fresh timestamp and at least one matching v1 signature. */
export function verifySvix(secret: string, headers: SvixHeaders, rawBody: string, nowMs = Date.now()): boolean {
  if (!/^\d{1,12}$/.test(headers.timestamp)) return false;
  if (Math.abs(nowMs / 1000 - Number(headers.timestamp)) > TIMESTAMP_TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(signSvix(secret, headers.id, headers.timestamp, rawBody), "base64");
  return headers.signature.split(" ").some((entry) => {
    const [version, signature] = entry.split(",");
    if (version !== "v1" || !signature) return false;
    const given = Buffer.from(signature, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
