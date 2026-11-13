import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyMarkupMicros, chargeMicros, costStatusOf, holdMicros, outputCap, usdPerTokenToMicrosPerM,
} from "./price-math.ts";

test("catalog price string -> micro-USD per 1M tokens (claude-opus-4.6, catalog 2026-11-12)", () => {
  assert.equal(usdPerTokenToMicrosPerM("0.0000050000"), 5_000_000); // $5 / 1M
  assert.equal(usdPerTokenToMicrosPerM("0.0000250000"), 25_000_000);
  assert.equal(usdPerTokenToMicrosPerM("0.0000000123"), 12_300);
  assert.equal(usdPerTokenToMicrosPerM("0"), 0);
  assert.equal(usdPerTokenToMicrosPerM("0.000000000000001"), null); // 15 decimals: below one micro per 1M
  for (const bad of ["-1", "1e-6", "", " 0.1", 0.000005, null]) assert.equal(usdPerTokenToMicrosPerM(bad), null);
});

test("markup rounds up to a whole micro-dollar, never down", () => {
  assert.equal(applyMarkupMicros(5_000_000, 0), 5_000_000);
  assert.equal(applyMarkupMicros(5_000_000, 1000), 5_500_000);
  assert.equal(applyMarkupMicros(12_300, 1), 12_302); // 12301.23 -> 12302
  assert.equal(applyMarkupMicros(12_300, -1000), 11_070);
});

test("charge = ceil(sum / 1M); PRD-style example", () => {
  const price = { inputMicros: 5_000_000, outputMicros: 25_000_000 };
  // 596 in, 2266 out at $5/$25: 2980 + 56650 = 59630 micro-USD
  assert.equal(chargeMicros(596, 2266, price), 59_630);
  assert.equal(chargeMicros(1, 0, { inputMicros: 1, outputMicros: 0 }), 1); // any use costs at least 1 micro
  assert.equal(chargeMicros(0, 0, price), 0);
  assert.equal(chargeMicros(2_000_000, 2_000_000, { inputMicros: 1e9, outputMicros: 1e9 }), 4e9); // no float loss
});

test("hold: body bytes ÷ 4 as input, output capped by the model", () => {
  assert.equal(outputCap(null, null), 4096);
  assert.equal(outputCap(null, 1000), 1000);
  assert.equal(outputCap(200, 128_000), 200);
  const price = { inputMicros: 5_000_000, outputMicros: 25_000_000 };
  assert.equal(holdMicros(401, 4096, price), chargeMicros(101, 4096, price));
});

test("cost status: known cost, failed before Surplus (nothing to look up), otherwise pending", () => {
  assert.equal(costStatusOf("succeeded", 12, "sr_1"), "known");
  assert.equal(costStatusOf("failed", 0, "sr_1"), "known");
  assert.equal(costStatusOf("failed", null, null), null);
  assert.equal(costStatusOf("failed", null, "sr_1"), "pending");
  assert.equal(costStatusOf("succeeded", null, null), "pending");
  assert.equal(costStatusOf("succeeded", null, "sr_1"), "pending");
});
