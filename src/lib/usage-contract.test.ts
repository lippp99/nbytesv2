import assert from "node:assert/strict";
import { test } from "node:test";
import { errorRateLabel, fillUsageDays, formatDuration, windowStartUtc } from "./usage-contract.ts";

const now = new Date("2026-03-01T05:00:00Z");

test("window: 30 UTC days ending today, across a month end", () => {
  assert.equal(windowStartUtc(now).toISOString(), "2026-01-31T00:00:00.000Z");
  const days = fillUsageDays([], now);
  assert.equal(days.length, 30);
  assert.equal(days[0].date, "2026-01-31");
  assert.equal(days[29].date, "2026-03-01");
  assert.ok(days.every((d) => d.chargeMicros === 0));
});

test("window: known days keep their value, others are 0", () => {
  const days = fillUsageDays([{ date: "2026-02-28", chargeMicros: 1_500_000 }, { date: "2026-03-01", chargeMicros: 7 }], now);
  assert.equal(days[28].chargeMicros, 1_500_000);
  assert.equal(days[29].chargeMicros, 7);
  assert.equal(days.reduce((s, d) => s + d.chargeMicros, 0), 1_500_007);
});

test("error rate: one decimal with a comma, never a long tail", () => {
  assert.equal(errorRateLabel(0, 0), "0%");
  assert.equal(errorRateLabel(0, 10), "0%");
  assert.equal(errorRateLabel(1, 3), "33,3%");
  assert.equal(errorRateLabel(1, 2), "50%");
  assert.equal(errorRateLabel(3, 3), "100%");
  assert.equal(errorRateLabel(41, 1_213_408), "<0,1%");
});

test("duration: ms below a second, seconds with one decimal above", () => {
  assert.equal(formatDuration(0), "0 ms");
  assert.equal(formatDuration(850), "850 ms");
  assert.equal(formatDuration(999), "999 ms");
  assert.equal(formatDuration(1000), "1,0 dtk");
  assert.equal(formatDuration(2430), "2,4 dtk");
  assert.equal(formatDuration(61_960), "62,0 dtk");
});
