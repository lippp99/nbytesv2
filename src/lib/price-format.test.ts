import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMicros, parseDollarsToMicros } from "./price-format.ts";

test("formatMicros keeps two decimals for whole cents", () => {
  assert.equal(formatMicros(0), "$0.00");
  assert.equal(formatMicros(2_500_000), "$2.50");
  assert.equal(formatMicros(15_000_000), "$15.00");
  assert.equal(formatMicros(1_234_000_000), "$1,234.00");
});

test("formatMicros shows sub-cent values", () => {
  assert.equal(formatMicros(3_200), "$0.0032");
  assert.equal(formatMicros(1), "$0.000001");
});

test("formatMicros rejects floats and negatives", () => {
  assert.throws(() => formatMicros(1.5), RangeError);
  assert.throws(() => formatMicros(-1), RangeError);
});

test("parseDollarsToMicros reads whole dollars and up to two decimals", () => {
  assert.equal(parseDollarsToMicros("40"), 40_000_000);
  assert.equal(parseDollarsToMicros(" 40.5 "), 40_500_000);
  assert.equal(parseDollarsToMicros("40,05"), 40_050_000);
  assert.equal(parseDollarsToMicros("0.01"), 10_000);
});

test("parseDollarsToMicros rejects everything else", () => {
  for (const bad of ["", "-1", "1.234", "abc", "1e3", "12345678"]) assert.equal(parseDollarsToMicros(bad), null, bad);
});
