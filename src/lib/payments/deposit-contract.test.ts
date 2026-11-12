import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_DEPOSIT_RULES as RULES, creditMicrosFor, depositFeeIdr, parseDepositBody, parseDepositRulesBody, parseExchangeRateBody,
  quoteDeposit,
} from "./deposit-contract.ts";

test("PRD examples: Rp 100.000 at 16.850 -> 5.934.718 micro-USD, pays Rp 103.000", () => {
  assert.equal(creditMicrosFor(100_000, 16_850), 5_934_718);
  assert.deepEqual(quoteDeposit(100_000, 16_850, 300), {
    amountIdr: 100_000, feeIdr: 3_000, totalIdr: 103_000, idrPerUsd: 16_850, creditMicros: 5_934_718,
  });
});

test("fee rounds up to whole rupiah, credit rounds down", () => {
  assert.equal(depositFeeIdr(50_001, 300), 1_501); // 1500.03 -> 1501
  assert.equal(depositFeeIdr(50_000, 300), 1_500);
  assert.equal(creditMicrosFor(1, 3), 333_333); // 333333.33 -> 333333
  assert.equal(creditMicrosFor(10_000_000, 1), 10_000_000_000_000); // largest case stays a safe integer
});

test("deposit body: whole rupiah between Rp 50.000 and Rp 10.000.000", () => {
  assert.deepEqual(parseDepositBody({ amountIdr: 50_000 }, RULES), { amountIdr: 50_000 });
  assert.deepEqual(parseDepositBody({ amountIdr: 10_000_000, extra: true }, RULES), { amountIdr: 10_000_000 });
  for (const amountIdr of [49_999, 10_000_001, 50_000.5, "50000", null, -1, Number.NaN]) {
    assert.equal(parseDepositBody({ amountIdr }, RULES), null, String(amountIdr));
  }
  assert.equal(parseDepositBody(null, RULES), null);
  assert.equal(parseDepositBody([50_000], RULES), null);
});

test("exchange rate body: positive whole number up to 1.000.000", () => {
  assert.deepEqual(parseExchangeRateBody({ idrPerUsd: 16_850 }), { idrPerUsd: 16_850 });
  for (const idrPerUsd of [0, -5, 16_850.5, "16850", 1_000_001]) {
    assert.equal(parseExchangeRateBody({ idrPerUsd }), null, String(idrPerUsd));
  }
});

test("deposit rules body: min <= max within Rp 10.000..Rp 100.000.000, fee 0..20%", () => {
  assert.deepEqual(parseDepositRulesBody({ minIdr: 50_000, maxIdr: 10_000_000, feeBp: 300, presetsIdr: [] }), RULES);
  const two = { minIdr: 20_000, maxIdr: 20_000, feeBp: 0, presetsIdr: [20_000] };
  assert.deepEqual(parseDepositRulesBody(two), two);
  const ok = { minIdr: 50_000, maxIdr: 60_000, feeBp: 300, presetsIdr: [] };
  for (const body of [
    { ...ok, minIdr: 9_999 }, { ...ok, minIdr: 70_000 }, { ...ok, maxIdr: 100_000_001 }, { ...ok, feeBp: 2_001 },
    { ...ok, feeBp: 2.5 }, { ...ok, minIdr: "50000" }, { ...ok, presetsIdr: undefined }, { ...ok, presetsIdr: [49_999] },
    { ...ok, presetsIdr: [60_001] }, { ...ok, presetsIdr: [55_000, 55_000] }, { ...ok, presetsIdr: [56_000, 55_000] },
    { ...ok, maxIdr: 100_000, presetsIdr: [51, 52, 53, 54, 55, 56, 57, 58, 59].map((k) => k * 1_000) }, null,
  ]) {
    assert.equal(parseDepositRulesBody(body), null, JSON.stringify(body));
  }
});
