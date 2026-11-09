import assert from "node:assert/strict";
import { test } from "node:test";
import { applyMarkup, formatBp, marginBpOf, markupBpOf, parsePercentToBp, tokensMicros } from "./margin-math.ts";

test("applyMarkup adds the markup and rounds up to a whole cent", () => {
  assert.equal(applyMarkup(2_700_000, 1_000), 2_970_000);
  assert.equal(applyMarkup(1_125_000, 1_500), 1_300_000); // 1.29375 -> 1.30
  assert.equal(applyMarkup(500_000, 0), 500_000);
});

test("markup is profit over cost, margin is profit over price", () => {
  assert.equal(markupBpOf(9_000_000, 10_000_000), 1_111);
  assert.equal(marginBpOf(9_000_000, 10_000_000), 1_000);
  assert.equal(marginBpOf(0, 0), 0);
});

test("tokensMicros prices a token count at a per-1M rate", () => {
  assert.equal(tokensMicros(3_000_000, 2_000), 6_000);
  assert.equal(tokensMicros(15_000_000, 500), 7_500);
});

test("parsePercentToBp accepts dot or comma and rejects nonsense", () => {
  assert.equal(parsePercentToBp("12"), 1_200);
  assert.equal(parsePercentToBp("12,5"), 1_250);
  assert.equal(parsePercentToBp(" 0.25 "), 25);
  assert.equal(parsePercentToBp("301"), null);
  assert.equal(parsePercentToBp("-5"), null);
  assert.equal(parsePercentToBp(""), null);
});

test("formatBp trims trailing zeros", () => {
  assert.equal(formatBp(1_250), "12.5%");
  assert.equal(formatBp(1_000), "10%");
  assert.equal(formatBp(1_111), "11.11%");
});
