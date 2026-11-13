import assert from "node:assert/strict";
import { test } from "node:test";
import { type ProfitSummary, bucketProfits, profitTotals } from "./profit-contract.ts";

const base: ProfitSummary = {
  period: { kind: "month", month: "2026-11" }, months: [], years: [],
  knownCostMicros: 0, knownCostChargeMicros: 0, amountIdr: 0, feeIdr: 0, providerFeeIdr: 0, creditMicros: 0,
  allAmountIdr: 0, allCreditMicros: 0, bucket: "day", buckets: [],
};

test("no paid deposit yet: USD totals only, no rupiah and no rate", () => {
  const t = profitTotals({ ...base, knownCostChargeMicros: 5_000_000, knownCostMicros: 3_000_000 });
  const usd = { api: 5_000_000, fee: 0, surplus: 3_000_000, sumopod: 0, apiProfit: 2_000_000, feeProfit: 0, profit: 2_000_000 };
  assert.deepEqual(t, { idrPerUsd: null, usd, idr: null });
});

test("two rates average by size: Rp 17.500.000 for $1000 + Rp 8.900.000 for $500 -> 17.600", () => {
  const s = {
    ...base, allAmountIdr: 26_400_000, allCreditMicros: 1_500_000_000, feeIdr: 352_000, providerFeeIdr: 176_000,
    knownCostChargeMicros: 300_000_000, knownCostMicros: 200_000_000,
  };
  const t = profitTotals(s);
  assert.equal(t.idrPerUsd, 17_600);
  // $300 charged -> Rp 5.280.000, $200 Surplus -> Rp 3.520.000; fee Rp 352.000 = $20, Sumopod Rp 176.000 = $10
  assert.deepEqual(t.idr, {
    api: 5_280_000, fee: 352_000, surplus: 3_520_000, sumopod: 176_000, apiProfit: 1_760_000, feeProfit: 176_000, profit: 1_936_000,
  });
  assert.deepEqual(t.usd, {
    api: 300_000_000, fee: 20_000_000, surplus: 200_000_000, sumopod: 10_000_000, apiProfit: 100_000_000, feeProfit: 10_000_000,
    profit: 110_000_000,
  });
});

test("a loss stays negative; large totals stay exact", () => {
  const s = {
    ...base, allAmountIdr: 17_500_000_000, allCreditMicros: 1_000_000_000_000, knownCostChargeMicros: 1_000_000, knownCostMicros: 3_000_000,
  };
  const idr = profitTotals(s).idr;
  assert.deepEqual([idr?.api, idr?.surplus, idr?.apiProfit, idr?.profit], [17_500, 52_500, -35_000, -35_000]);
  const big = profitTotals({ ...s, knownCostChargeMicros: 1_000_000_000_000, knownCostMicros: 0 });
  assert.equal(big.idr?.api, 17_500_000_000);
});

test("bucket profits use the period's rate; a losing day stays negative and the days add up to the period", () => {
  const day = (date: string, charge: number, cost: number, fee: number, sumopod: number) =>
    ({ date, knownCostChargeMicros: charge, knownCostMicros: cost, feeIdr: fee, providerFeeIdr: sumopod });
  const buckets = [day("2026-11-12", 2_000_000, 1_000_000, 500, 479), day("2026-11-13", 0, 0, 100, 371)];
  const s = {
    ...base, allAmountIdr: 17_500_000, allCreditMicros: 1_000_000_000, buckets,
    knownCostChargeMicros: 2_000_000, knownCostMicros: 1_000_000, feeIdr: 600, providerFeeIdr: 850,
  };
  const days = bucketProfits(s);
  // 12 Nov: $1 margin = Rp 17.500, + Rp 21 fee kept. 13 Nov: only a deposit, Rp 100 - Rp 371 = loss.
  assert.deepEqual(days.map((d) => d.idr), [17_521, -271]);
  assert.equal(days[1].usd < 0, true);
  assert.equal(days.reduce((a, d) => a + (d.idr ?? 0), 0), profitTotals(s).idr?.profit);
  assert.deepEqual(bucketProfits({ ...base, buckets }).map((d) => d.idr), [null, null]);
});
