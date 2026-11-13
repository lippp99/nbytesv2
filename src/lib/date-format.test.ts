import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCountdown, formatWib, formatWibDate, formatWibStamp, wibMonthStart } from "./date-format.ts";

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

test("admin stamp and month start follow WIB", () => {
  assert.equal(formatWibStamp("2026-11-08T09:14:22.000Z"), "2026-11-08 16:14");
  assert.equal(formatWibStamp("2026-12-31T18:05:00.000Z"), "2027-01-01 01:05");
  assert.equal(wibMonthStart(new Date("2026-11-30T17:30:00Z")).toISOString(), "2026-11-30T17:00:00.000Z");
  assert.equal(wibMonthStart(new Date("2026-11-13T06:00:00Z")).toISOString(), "2026-10-31T17:00:00.000Z");
});

test("formatWibDate is the WIB calendar day", () => {
  assert.equal(formatWibDate("2026-11-10T16:59:00.000Z"), "10 Nov 2026");
  assert.equal(formatWibDate("2026-11-10T17:00:00.000Z"), "11 Nov 2026");
});
