import "server-only";

// Sumopod config (PRD gateway-api §12). Sandbox and Live use different values [P5]. Read when a payment endpoint runs,
// not at boot, so the app still starts before Sumopod is set up; a missing value answers 503 and is logged.

export type PaymentsEnv = { apiKey: string; apiBaseUrl: string; webhookSecret: string };

export function paymentsEnv(): PaymentsEnv {
  const missing = ["SUMOPOD_API_KEY", "SUMOPOD_API_BASE_URL", "SUMOPOD_WEBHOOK_SECRET"].filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Payments config missing: ${missing.join(", ")}`);
  const secret = process.env.SUMOPOD_WEBHOOK_SECRET!;
  if (!secret.startsWith("whsec_")) throw new Error('SUMOPOD_WEBHOOK_SECRET must be the "whsec_..." signing secret');
  return {
    apiKey: process.env.SUMOPOD_API_KEY!,
    apiBaseUrl: new URL(process.env.SUMOPOD_API_BASE_URL!).origin,
    webhookSecret: secret,
  };
}
