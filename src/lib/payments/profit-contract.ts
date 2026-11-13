// Admin Billing profit summary (PRD gateway-pricing-billing §11, "Keuangan"): one period's gateway money (USD) and paid
// deposits (rupiah), plus the pure rule that turns them into an estimate in rupiah. Money stays integer.
import type { UsagePeriod } from "@/lib/admin-gateway/usage-contract";

const MICROS_PER_USD = 1_000_000;

export type ProfitSummary = {
  period: UsagePeriod;
  months: string[];
  years: string[];
  /** Gateway requests of the period whose Surplus cost is known (billing §10): their charge and that cost. */
  knownCostMicros: number;
  knownCostChargeMicros: number;
  /** Deposits paid in the period: principal, the fee users paid nbytes, Sumopod's fee, USD credited. */
  amountIdr: number;
  feeIdr: number;
  providerFeeIdr: number;
  creditMicros: number;
  /** Every paid deposit up to the end of the period: what users paid for the USD they spend from their balance. */
  allAmountIdr: number;
  allCreditMicros: number;
  /** One per WIB day (or month for a year / long range), oldest first, zeros where nothing happened. */
  bucket: "day" | "month";
  buckets: ProfitBucket[];
};

/** The money of one chart bucket: the same inputs as the period, cut to that day or month. */
export type ProfitBucket = { date: string; knownCostChargeMicros: number; knownCostMicros: number; feeIdr: number; providerFeeIdr: number };

// BigInt keeps the product exact above 2^53; the division truncates, so at most 1 rupiah off.
const mulDiv = (a: number, b: number, d: number) => Number((BigInt(a) * BigInt(b)) / BigInt(d));

/**
 * Each money flow on its own, in one currency: users paid for API use and for deposit fees; nbytes paid Surplus and
 * Sumopod. Profit from the API, from deposits, and both together.
 */
export type Flows = {
  api: number; fee: number; surplus: number; sumopod: number;
  apiProfit: number; feeProfit: number; profit: number;
};

export type ProfitTotals = {
  /** Size-weighted average rate of paid deposits; null before the first one. */
  idrPerUsd: number | null;
  /** micro-USD; deposit fee and Sumopod's cut converted at the average rate. */
  usd: Flows;
  /** rupiah; API use and Surplus converted at the average rate. null without a rate. */
  idr: Flows | null;
};

const flows = (api: number, fee: number, surplus: number, sumopod: number): Flows => ({
  api, fee, surplus, sumopod, apiProfit: api - surplus, feeProfit: fee - sumopod, profit: api - surplus + fee - sumopod,
});

/**
 * One period's money in both currencies, from requests whose Surplus cost is known and the period's paid deposits.
 * shortcut: assumes Surplus credit cost the same rupiah per USD as users paid; upgrade once Surplus top-ups are recorded.
 */
export function profitTotals(s: ProfitSummary): ProfitTotals {
  const rated = s.allCreditMicros > 0 && s.allAmountIdr > 0;
  // A period with a deposit fee always has a rate (its deposits are part of "all"), so 0 without one is exact.
  const toUsd = (idr: number) => (rated ? mulDiv(idr, s.allCreditMicros, s.allAmountIdr) : 0);
  const usd = flows(s.knownCostChargeMicros, toUsd(s.feeIdr), s.knownCostMicros, toUsd(s.providerFeeIdr));
  if (!rated) return { idrPerUsd: null, usd, idr: null };
  const toIdr = (micros: number) => mulDiv(micros, s.allAmountIdr, s.allCreditMicros);
  return {
    idrPerUsd: mulDiv(s.allAmountIdr, MICROS_PER_USD, s.allCreditMicros),
    usd,
    idr: flows(toIdr(s.knownCostChargeMicros), s.feeIdr, toIdr(s.knownCostMicros), s.providerFeeIdr),
  };
}

/**
 * Net profit of each bucket in both currencies, at the period's average rate (so the buckets add up to the period,
 * up to 1 rupiah or micro-dollar per bucket from rounding). idr is null without a rate.
 */
export function bucketProfits(s: ProfitSummary): { date: string; usd: number; idr: number | null }[] {
  return s.buckets.map((b) => {
    const t = profitTotals({ ...s, ...b });
    return { date: b.date, usd: t.usd.profit, idr: t.idr?.profit ?? null };
  });
}
