import assert from "node:assert/strict";
import { test } from "node:test";
import { creditMicrosFor, depositFeeIdr, parseDepositBody, parseExchangeRateBody, quoteDeposit } from "./deposit-contract.ts";

test("PRD examples: Rp 100.000 at 16.850 -> 5.934.718 micro-USD, pays Rp 103.000", () => {
  assert.equal(creditMicrosFor(100_000, 16_850), 5_934_718);
  assert.deepEqual(quoteDeposit(100_000, 16_850), {
    amountIdr: 100_000, feeIdr: 3_000, totalIdr: 103_000, idrPerUsd: 16_850, creditMicros: 5_934_718,
  });
});

test("fee rounds up to whole rupiah, credit rounds down", () => {
  assert.equal(depositFeeIdr(50_001), 1_501); // 1500.03 -> 1501
  assert.equal(depositFeeIdr(50_000), 1_500);
  assert.equal(creditMicrosFor(1, 3), 333_333); // 333333.33 -> 333333
  assert.equal(creditMicrosFor(10_000_000, 1), 10_000_000_000_000); // largest case stays a safe integer
});

test("deposit body: whole rupiah between Rp 50.000 and Rp 10.000.000", () => {
  assert.deepEqual(parseDepositBody({ amountIdr: 50_000 }), { amountIdr: 50_000 });
  assert.deepEqual(parseDepositBody({ amountIdr: 10_000_000, extra: true }), { amountIdr: 10_000_000 });
  for (const amountIdr of [49_999, 10_000_001, 50_000.5, "50000", null, -1, Number.NaN]) {
    assert.equal(parseDepositBody({ amountIdr }), null, String(amountIdr));
  }
  assert.equal(parseDepositBody(null), null);
  assert.equal(parseDepositBody([50_000]), null);
});

test("exchange rate body: positive whole number up to 1.000.000", () => {
  assert.deepEqual(parseExchangeRateBody({ idrPerUsd: 16_850 }), { idrPerUsd: 16_850 });
  for (const idrPerUsd of [0, -5, 16_850.5, "16850", 1_000_001]) {
    assert.equal(parseExchangeRateBody({ idrPerUsd }), null, String(idrPerUsd));
  }
});
