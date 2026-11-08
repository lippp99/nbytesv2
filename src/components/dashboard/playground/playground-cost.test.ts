import assert from "node:assert/strict";
import { test } from "node:test";
import type { Model } from "../../../lib/model-catalog.ts";
import { callCostMicros, estimateTokens } from "./playground-cost.ts";

const model = { inputPerMTokMicros: 1_250_000, outputPerMTokMicros: 10_000_000 } as Model;

test("estimateTokens rounds up and ignores surrounding space", () => {
  assert.equal(estimateTokens(""), 0);
  assert.equal(estimateTokens("   "), 0);
  assert.equal(estimateTokens("Hi"), 1);
  assert.equal(estimateTokens("  Halo dunia  "), 3);
});

test("callCostMicros prices input and output separately, in whole micro-dollars", () => {
  assert.equal(callCostMicros(model, 1_000_000, 0), 1_250_000);
  assert.equal(callCostMicros(model, 0, 1_000_000), 10_000_000);
  assert.equal(callCostMicros(model, 100, 200), 2_125);
});
