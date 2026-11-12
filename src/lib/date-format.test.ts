import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCountdown, formatWib } from "./date-format.ts";

test("formatCountdown shows minutes and two-digit seconds", () => {
  assert.equal(formatCountdown(60), "1:00");
  assert.equal(formatCountdown(59), "0:59");
  assert.equal(formatCountdown(899), "14:59");
  assert.equal(formatCountdown(0), "0:00");
});

test("formatWib shifts UTC to WIB and rolls over the day", () => {
  assert.equal(formatWib("2026-11-10T07:20:00.000Z"), "10 Nov, 14.20 WIB");
  assert.equal(formatWib("2026-12-31T18:05:00.000Z"), "1 Jan, 01.05 WIB");
});

test("formatWib with the year uses the WIB year, not the UTC one", () => {
  assert.equal(formatWib("2026-11-10T07:20:00.000Z", true), "10 Nov 2026, 14.20 WIB");
  assert.equal(formatWib("2026-12-31T18:05:00.000Z", true), "1 Jan 2027, 01.05 WIB");
});
