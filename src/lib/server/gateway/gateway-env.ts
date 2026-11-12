import "server-only";

// Gateway config (PRD gateway-api §12). Read when a gateway endpoint runs, not at boot, so the app still starts before
// Surplus is set up; a missing value answers 503 and is logged (same approach as payments-env.ts).

const MIN_KEY_BYTES = 32;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Gateway config missing: ${name}`);
  return value;
}

/** Surplus origin (e.g. https://api.surplusintelligence.ai); paths /v1/... are added by the client. */
export const surplusOrigin = () => new URL(required("SURPLUS_BASE_URL")).origin;

/** nbytes' own Surplus buyer key ("inf_..."). Never sent to a user, never logged. */
export const surplusApiKey = () => required("SURPLUS_API_KEY");

/** HMAC key for stored API key hashes. Changing it invalidates every user's API key. */
export function apiKeyHashKey(): Buffer {
  const key = Buffer.from(required("API_KEY_HASH_SECRET"), "base64");
  if (key.length < MIN_KEY_BYTES) throw new Error(`API_KEY_HASH_SECRET must be at least ${MIN_KEY_BYTES} random bytes (base64)`);
  return key;
}
