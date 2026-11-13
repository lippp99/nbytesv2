// Admin Finance page data (PRD gateway-pricing-billing §5, §6, §11, B9): what the server sends, and the ?status= filter.
// Money stays integer: rupiah and micro-USD. Times travel as ISO strings; pages show them in WIB.
import { type UsagePeriod, periodParams } from "../admin-gateway/usage-contract.ts";

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

export type ExchangeRateEntry = { idrPerUsd: number; setAt: string; setBy: string | null };

/** "?status=stuck" -> "stuck"; anything else (missing, unknown, array) -> "all". */
export function parseDepositFilter(value: unknown): DepositFilter {
  return DEPOSIT_FILTERS.find((filter) => filter === value) ?? "all";
}

/** pending past its expiry shows as stuck; every other status is shown as stored. */
export function depositState(status: "pending" | "paid" | "failed" | "expired", expiresAt: Date, now: Date): DepositState {
  return status === "pending" && expiresAt.getTime() < now.getTime() ? "stuck" : status;
}

/** Currency of the profit summary (?currency=idr); USD is the default. */
export type Currency = "usd" | "idr";
export const parseCurrency = (value: unknown): Currency => (value === "idr" ? "idr" : "usd");

/** The Billing URL: profit period (Usage's URL form) and currency, deposit filter and page; defaults left out. */
export function billingHref(
  period: UsagePeriod, currentMonth: string, filter: DepositFilter, page = 1, currency: Currency = "usd",
): string {
  const params = periodParams(period, currentMonth);
  if (currency !== "usd") params.set("currency", currency);
  if (filter !== "all") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `/admin/billing?${text}` : "/admin/billing";
}
