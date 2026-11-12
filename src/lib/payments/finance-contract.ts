// Admin Finance page data (PRD gateway-pricing-billing §5, §6, §11, B9): what the server sends, and the ?status= filter.
// Money stays integer: rupiah and micro-USD. Times are ISO strings in UTC.

export const DEPOSITS_PAGE_SIZE = 25;

/** "stuck" = still pending after its expiry: no webhook came, to be matched by hand in Sumopod (B9). */
export const DEPOSIT_FILTERS = ["all", "paid", "pending", "stuck", "failed", "expired"] as const;
export type DepositFilter = (typeof DEPOSIT_FILTERS)[number];
export type DepositState = Exclude<DepositFilter, "all">;

export type AdminDeposit = {
  id: string;
  createdAt: string;
  /** null when the account was deleted afterwards. */
  email: string | null;
  totalIdr: number;
  idrPerUsd: number;
  creditMicros: number;
  providerFeeIdr: number | null;
  state: DepositState;
};

export type DepositsPage = { deposits: AdminDeposit[]; page: number; pages: number; total: number };

/** This UTC month's paid deposits, and the stuck ones of any month. */
export type DepositSummary = {
  paidCount: number;
  receivedIdr: number;
  providerFeeIdr: number;
  netIdr: number;
  creditMicros: number;
  stuckCount: number;
};

export type ExchangeRateEntry = { idrPerUsd: number; setAt: string; setBy: string | null };

/** "?status=stuck" -> "stuck"; anything else (missing, unknown, array) -> "all". */
export function parseDepositFilter(value: unknown): DepositFilter {
  return DEPOSIT_FILTERS.find((filter) => filter === value) ?? "all";
}

/** pending past its expiry shows as stuck; every other status is shown as stored. */
export function depositState(status: "pending" | "paid" | "failed" | "expired", expiresAt: Date, now: Date): DepositState {
  return status === "pending" && expiresAt.getTime() < now.getTime() ? "stuck" : status;
}
