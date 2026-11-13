import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bucketOf, changeBp, dayOf, fillBuckets, monthOf, monthOptions, parsePeriod, parseUsageQuery, periodRange, previousPeriod, rangeError,
  shareBp, usageHref, USAGE_MONTHS_MAX, yearOptions,
} from "./usage-contract.ts";

const now = new Date("2026-11-13T08:00:00Z");
const day = (s: string) => new Date(`${s}T00:00:00+07:00`);

test("period range is [start, end) in WIB days; a date range includes its last day", () => {
  assert.deepEqual(periodRange({ kind: "month", month: "2026-12" }), { start: day("2026-12-01"), end: day("2027-01-01") });
  assert.deepEqual(periodRange({ kind: "year", year: "2026" }), { start: day("2026-01-01"), end: day("2027-01-01") });
  assert.deepEqual(periodRange({ kind: "range", from: "2026-11-01", to: "2026-11-07" }),
    { start: day("2026-11-01"), end: day("2026-11-08") });
});

test("previous period: month and year before, or a range of the same length ending the day before", () => {
  assert.deepEqual(previousPeriod({ kind: "month", month: "2026-01" }), { kind: "month", month: "2025-12" });
  assert.deepEqual(previousPeriod({ kind: "year", year: "2026" }), { kind: "year", year: "2025" });
  assert.deepEqual(previousPeriod({ kind: "range", from: "2026-03-01", to: "2026-03-07" }),
    { kind: "range", from: "2026-02-22", to: "2026-02-28" });
});

test("range checks: real days, order, not in the future, at most 366 days", () => {
  assert.equal(rangeError("2026-11-01", "2026-11-13", "2026-11-13"), null);
  assert.equal(rangeError("2026-02-30", "2026-03-01", "2026-11-13"), "invalid");
  assert.equal(rangeError("2026-11", "2026-11-13", "2026-11-13"), "invalid");
  assert.equal(rangeError("2026-11-10", "2026-11-01", "2026-11-13"), "order");
  assert.equal(rangeError("2026-11-01", "2026-11-14", "2026-11-13"), "future");
  assert.equal(rangeError("2025-11-12", "2026-11-13", "2026-11-13"), "too_long"); // 367 days
  assert.equal(rangeError("2025-11-13", "2026-11-13", "2026-11-13"), null); // 366 days
});

test("period from the URL: anything invalid or in the future falls back to this month", () => {
  const current = { kind: "month", month: "2026-11" };
  assert.deepEqual(parsePeriod({ month: "2026-09" }, now), { kind: "month", month: "2026-09" });
  assert.deepEqual(parsePeriod({ month: "2026-12" }, now), current);
  assert.deepEqual(parsePeriod({ period: "year", year: "2025" }, now), { kind: "year", year: "2025" });
  assert.deepEqual(parsePeriod({ period: "year", year: "2027" }, now), current);
  assert.deepEqual(parsePeriod({ period: "range", from: "2026-11-01", to: "2026-11-05" }, now),
    { kind: "range", from: "2026-11-01", to: "2026-11-05" });
  assert.deepEqual(parsePeriod({ period: "range", from: "2026-11-05", to: "2026-11-01" }, now), current);
  assert.deepEqual(parsePeriod({ period: "range", from: ["2026-11-01"], to: "2026-11-05" }, now), current);
});

test("query: unknown sort to tokens; search trimmed", () => {
  const q = parseUsageQuery({ sort: "drop table", q: "  a@b.c " }, { page: 2, modelPage: 3 }, now);
  assert.equal(q.sort, "tokens");
  assert.equal(q.search, "a@b.c");
  assert.deepEqual([q.page, q.modelPage], [2, 3]);
  assert.equal(parseUsageQuery({ q: "   " }, { page: 1, modelPage: 1 }, now).search, null);
});

test("href leaves out defaults and round-trips through the parser", () => {
  const base = { sort: "tokens" as const, search: null };
  assert.equal(usageHref({ ...base, period: { kind: "month", month: "2026-11" } }, "2026-11"), "/admin/usage");
  const range = { kind: "range" as const, from: "2026-10-01", to: "2026-10-31" };
  const href = usageHref({ period: range, sort: "charge", search: "x y" }, "2026-11", { page: 3, modelPage: 2 });
  assert.equal(href, "/admin/usage?period=range&from=2026-10-01&to=2026-10-31&sort=charge&q=x+y&mpage=2&page=3");
  const params = Object.fromEntries(new URL(href, "http://x").searchParams);
  assert.deepEqual(parsePeriod(params, now), range);
  assert.equal(usageHref({ ...base, period: { kind: "year", year: "2025" } }, "2026-11"), "/admin/usage?period=year&year=2025");
});

test("chart buckets: days for a month or a short range, months for a year or a long range", () => {
  const feb = fillBuckets({ kind: "month", month: "2026-02" }, [{ date: "2026-02-10", inputTokens: 5, outputTokens: 7 }]);
  assert.equal(feb.length, 28);
  assert.deepEqual(feb[9], { date: "2026-02-10", inputTokens: 5, outputTokens: 7 });
  assert.equal(fillBuckets({ kind: "year", year: "2026" }, []).length, 12);
  assert.equal(bucketOf({ kind: "range", from: "2026-09-01", to: "2026-11-01" }), "day");
  const long = { kind: "range" as const, from: "2026-01-15", to: "2026-11-13" };
  assert.equal(bucketOf(long), "month");
  assert.deepEqual(fillBuckets(long, []).map((b) => b.date).slice(0, 2), ["2026-01", "2026-02"]);
  assert.equal(fillBuckets(long, []).length, 11);
});

test("month and year options: first request to now, newest first, capped", () => {
  assert.deepEqual(monthOptions(null, now), ["2026-11"]);
  assert.deepEqual(monthOptions(day("2026-09-30"), now), ["2026-11", "2026-10", "2026-09"]);
  assert.equal(monthOptions(day("2000-01-01"), now).length, USAGE_MONTHS_MAX);
  assert.deepEqual(yearOptions(day("2024-06-01"), now), ["2026", "2025", "2024"]);
  assert.deepEqual(yearOptions(null, now), ["2026"]);
});

test("share and change in basis points; null when the base is zero", () => {
  assert.equal(shareBp(1, 3), 3333);
  assert.equal(shareBp(5, 0), null);
  assert.equal(changeBp(150, 100), 5000);
  assert.equal(changeBp(10, 0), null);
});

test("WIB clock: 17.00 UTC is already the next day and, at month end, the next month", () => {
  assert.equal(dayOf(new Date("2026-11-12T16:59:00Z")), "2026-11-12");
  assert.equal(dayOf(new Date("2026-11-12T17:00:00Z")), "2026-11-13");
  assert.equal(monthOf(new Date("2026-11-30T17:30:00Z")), "2026-12");
  assert.deepEqual(parsePeriod({}, new Date("2026-12-31T18:00:00Z")), { kind: "month", month: "2027-01" });
  assert.deepEqual(yearOptions(null, new Date("2026-12-31T18:00:00Z")), ["2027"]);
});
