// Admin Upstream page (PRD admin-requests-upstream §4, R1/R4). Surplus is nbytes' only upstream.

/**
 * Read from GET /v1/payments/balance (checked against the live API on 2026-11-12: every *_usdc field is a string of
 * digits, micro-USD per the docs [S2]). Only the fields the page shows; held amounts are left out because which of
 * fiat_held/usdc_held applies to nbytes is not documented.
 */
export type SurplusBalance = { creditMicros: number; autoTopup: boolean | null; accountStatus: string | null };

export type ModelHealth = {
  modelId: string;
  /** In the curated catalog and active; false: called earlier but turned off since. */
  active: boolean;
  requests: number;
  failed: number;
  /** errorCode model_unavailable: no seller, discount floor not met, or no healthy seller. */
  unavailable: number;
  p50LatencyMs: number | null;
  costPending: number;
  negativeMargin: number;
};

/** Failures that are nbytes' problem, not the user's: our Surplus key, credit or budget (gateway-api §9). */
export type AttentionItem = { upstreamErrorCode: string | null; statusCode: number | null; count: number; lastAt: string };

export type UpstreamHealth = {
  balance: SurplusBalance | null;
  windowHours: number;
  models: ModelHealth[];
  attention: AttentionItem[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The balance answer, or null when credit_balance_usdc is missing or not a digit string. */
export function parseSurplusBalance(json: unknown): SurplusBalance | null {
  if (!isRecord(json) || typeof json.credit_balance_usdc !== "string" || !/^\d{1,15}$/.test(json.credit_balance_usdc)) return null;
  return {
    creditMicros: Number(json.credit_balance_usdc),
    autoTopup: typeof json.auto_topup_enabled === "boolean" ? json.auto_topup_enabled : null,
    accountStatus: typeof json.account_status === "string" ? json.account_status.slice(0, 40) : null,
  };
}
