// Deposit rules and request bodies (PRD gateway-pricing-billing §4–§6). Integer money only: rupiah, micro-USD
// (1 USD = 1_000_000), basis points (100 = 1%). Shared by the server and, later, the Billing page preview.

// shortcut: fixed in code (owner, 2026-11-11); PRD says admin-adjustable, move to a settings table with the admin page.
export const DEPOSIT_RULES = { minIdr: 50_000, maxIdr: 10_000_000, feeBp: 300 } as const; // B2, B3
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
export const depositFeeIdr = (amountIdr: number, feeBp: number = DEPOSIT_RULES.feeBp) =>
  Math.ceil((amountIdr * feeBp) / 10_000);

/** §5.3: floor(amount × 1_000_000 / rate), rounded down so we never credit more than was paid. */
export const creditMicrosFor = (amountIdr: number, idrPerUsd: number) => Math.floor((amountIdr * 1_000_000) / idrPerUsd);

export function quoteDeposit(amountIdr: number, idrPerUsd: number): DepositQuote {
  const feeIdr = depositFeeIdr(amountIdr);
  return { amountIdr, feeIdr, totalIdr: amountIdr + feeIdr, idrPerUsd, creditMicros: creditMicrosFor(amountIdr, idrPerUsd) };
}

/** Body of POST /api/payments/deposits: whole rupiah within B2. Other fields are ignored. */
export function parseDepositBody(json: unknown): { amountIdr: number } | null {
  if (!isRecord(json) || !isWholeInRange(json.amountIdr, DEPOSIT_RULES.minIdr, DEPOSIT_RULES.maxIdr)) return null;
  return { amountIdr: json.amountIdr };
}

/** Body of POST /api/admin/exchange-rate: whole rupiah per 1 USD. */
export function parseExchangeRateBody(json: unknown): { idrPerUsd: number } | null {
  if (!isRecord(json) || !isWholeInRange(json.idrPerUsd, 1, MAX_IDR_PER_USD)) return null;
  return { idrPerUsd: json.idrPerUsd };
}

/** What POST /api/payments/deposits answers: the locked numbers and where to pay. */
export type CreatedDeposit = DepositQuote & { id: string; paymentLinkUrl: string; expiresAt: string };

/** Quick picks on the Billing page; each lies inside DEPOSIT_RULES. */
export const DEPOSIT_PRESETS_IDR = [50_000, 100_000, 250_000, 500_000, 1_000_000] as const;

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
