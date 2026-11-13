import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCents, formatIdr, formatMicros, formatSignedCents, formatSignedMicros, parseDollarsToMicros } from "./price-format.ts";

test("formatCents rounds to two decimals with comma thousands", () => {
  assert.equal(formatCents(5_177_871), "$5.18");
  assert.equal(formatCents(1_111_461), "$1.11");
  assert.equal(formatCents(1_000_000_000), "$1,000.00");
  assert.equal(formatCents(1_234_567_890_000), "$1,234,567.89");
  assert.equal(formatCents(4_999), "<$0.01");
  assert.equal(formatCents(5_000), "$0.01");
  assert.equal(formatCents(0), "$0.00");
  assert.equal(formatSignedCents(-2_500_000), "−$2.50");
  assert.throws(() => formatCents(-1), RangeError);
});

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

test("formatIdr groups whole rupiah with dots", () => {
  assert.equal(formatIdr(0), "Rp 0");
  assert.equal(formatIdr(661), "Rp 661");
  assert.equal(formatIdr(103_000), "Rp 103.000");
  assert.equal(formatIdr(10_300_000), "Rp 10.300.000");
  assert.throws(() => formatIdr(-1), RangeError);
  assert.throws(() => formatIdr(1.5), RangeError);
});

test("formatSignedMicros shows a negative balance with a minus sign", () => {
  assert.equal(formatSignedMicros(2_967_359), "$2.967359");
  assert.equal(formatSignedMicros(-120_000), "−$0.12");
  assert.equal(formatSignedMicros(0), "$0.00");
});
