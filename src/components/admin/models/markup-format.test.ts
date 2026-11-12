import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBp, parsePercentToBp } from "./markup-format.ts";

test("parsePercentToBp accepts dot or comma and rejects nonsense", () => {
  assert.equal(parsePercentToBp("12"), 1_200);
  assert.equal(parsePercentToBp("12,5"), 1_250);
  assert.equal(parsePercentToBp(" 0.25 "), 25);
  assert.equal(parsePercentToBp("0"), 0);
  assert.equal(parsePercentToBp("300"), 30_000);
  assert.equal(parsePercentToBp("301"), null);
  assert.equal(parsePercentToBp("-5"), null);
  assert.equal(parsePercentToBp(""), null);
});

test("formatBp trims trailing zeros", () => {
  assert.equal(formatBp(1_250), "12.5");
  assert.equal(formatBp(1_000), "10");
  assert.equal(formatBp(0), "0");
  assert.equal(formatBp(1_111), "11.11");
});
