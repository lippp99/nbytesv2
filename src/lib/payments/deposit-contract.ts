// Deposit rules and request bodies (PRD gateway-pricing-billing §4–§6). Integer money only: rupiah, micro-USD
// (1 USD = 1_000_000), basis points (100 = 1%). Shared by the server and, later, the Billing page preview.

/** Deposit limits, fee (B2, B3) and the Billing quick picks. Admin-adjustable; the newest deposit_rules row is in force. */
export type DepositRules = { minIdr: number; maxIdr: number; feeBp: number; presetsIdr: number[] };
/** In force until an admin saves the first rules (owner decisions B2, B3, 2026-11-11; no quick picks, owner 2026-11-12). */
export const DEFAULT_DEPOSIT_RULES: DepositRules = { minIdr: 50_000, maxIdr: 10_000_000, feeBp: 300, presetsIdr: [] };
/** Bounds for what an admin may save: below Rp 10.000 the Sumopod Rp 300 fixed fee eats the margin; fee at most 20%. */
export const DEPOSIT_RULE_BOUNDS = { minIdr: 10_000, maxIdr: 100_000_000, maxFeeBp: 2_000, maxPresets: 8 } as const;
export const DEPOSIT_EXPIRES_HOURS = 24; // §5.2, Sumopod maximum
/** Sanity bound for the admin rate ("1 USD = X rupiah"): catches an extra zero, keeps the math in safe integers. */
export const MAX_IDR_PER_USD = 1_000_000;

export type DepositQuote = {
  amountIdr: number;
  feeIdr: number;
  /** What the user pays Sumopod: amount + fee. */
  totalIdr: number;
  idrPerUsd: number;
  creditMicros: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isWholeInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;

/** §6.2: fee in whole rupiah, rounded up; it does not add to the balance. */
export const depositFeeIdr = (amountIdr: number, feeBp: number) =>
  Math.ceil((amountIdr * feeBp) / 10_000);

/** §5.3: floor(amount × 1_000_000 / rate), rounded down so we never credit more than was paid. */
export const creditMicrosFor = (amountIdr: number, idrPerUsd: number) => Math.floor((amountIdr * 1_000_000) / idrPerUsd);

export function quoteDeposit(amountIdr: number, idrPerUsd: number, feeBp: number): DepositQuote {
  const feeIdr = depositFeeIdr(amountIdr, feeBp);
  return { amountIdr, feeIdr, totalIdr: amountIdr + feeIdr, idrPerUsd, creditMicros: creditMicrosFor(amountIdr, idrPerUsd) };
}

/** Body of POST /api/payments/deposits: whole rupiah within the rules in force. Other fields are ignored. */
export function parseDepositBody(json: unknown, rules: DepositRules): { amountIdr: number } | null {
  if (!isRecord(json) || !isWholeInRange(json.amountIdr, rules.minIdr, rules.maxIdr)) return null;
  return { amountIdr: json.amountIdr };
}

/**
 * Body of POST /api/admin/deposit-rules: whole rupiah min <= max inside the bounds, fee 0..maxFeeBp basis points, and
 * up to maxPresets quick picks, each between min and max, strictly ascending (so no duplicates).
 */
export function parseDepositRulesBody(json: unknown): DepositRules | null {
  const b = DEPOSIT_RULE_BOUNDS;
  if (!isRecord(json) || !isWholeInRange(json.minIdr, b.minIdr, b.maxIdr)) return null;
  if (!isWholeInRange(json.maxIdr, json.minIdr, b.maxIdr) || !isWholeInRange(json.feeBp, 0, b.maxFeeBp)) return null;
  const { minIdr, maxIdr, presetsIdr: presets } = json;
  if (!Array.isArray(presets) || presets.length > b.maxPresets) return null;
  const ok = presets.every((p, i) => isWholeInRange(p, minIdr, maxIdr) && (i === 0 || p > presets[i - 1]));
  return ok ? { minIdr, maxIdr, feeBp: json.feeBp, presetsIdr: presets } : null;
}

/** Body of POST /api/admin/exchange-rate: whole rupiah per 1 USD. */
export function parseExchangeRateBody(json: unknown): { idrPerUsd: number } | null {
  if (!isRecord(json) || !isWholeInRange(json.idrPerUsd, 1, MAX_IDR_PER_USD)) return null;
  return { idrPerUsd: json.idrPerUsd };
}

/** What POST /api/payments/deposits answers: the locked numbers and where to pay. */
export type CreatedDeposit = DepositQuote & { id: string; paymentLinkUrl: string; expiresAt: string };

/** The signed-in user's balance (§8). Available = balance − held; the balance may be slightly negative (B7). */
export type UserBalance = { balanceMicros: number; heldMicros: number };

/** One of the user's own deposits on the Billing page. The pay link is only sent while it can still be paid. */
export type UserDeposit = {
  id: string;
  createdAt: string;
  amountIdr: number;
  totalIdr: number;
  idrPerUsd: number;
  creditMicros: number;
  state: "paid" | "pending" | "stuck" | "failed" | "expired";
  paymentLinkUrl: string | null;
};
