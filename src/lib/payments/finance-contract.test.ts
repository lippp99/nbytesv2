import assert from "node:assert/strict";
import { test } from "node:test";
import { billingHref, depositState, parseCurrency, parseDepositFilter } from "./finance-contract.ts";

test("status filter: known values pass, anything else is all", () => {
  assert.equal(parseDepositFilter("stuck"), "stuck");
  assert.equal(parseDepositFilter("paid"), "paid");
  for (const value of [undefined, "", "PAID", "refunded", ["paid"], 1]) assert.equal(parseDepositFilter(value), "all");
});

test("pending past expiry is stuck; other statuses stay", () => {
  const now = new Date("2026-11-11T12:00:00Z");
  assert.equal(depositState("pending", new Date("2026-11-11T11:59:59Z"), now), "stuck");
  assert.equal(depositState("pending", new Date("2026-11-11T12:00:00Z"), now), "pending");
  assert.equal(depositState("paid", new Date("2026-11-10T00:00:00Z"), now), "paid");
  assert.equal(depositState("expired", new Date("2026-11-10T00:00:00Z"), now), "expired");
});

test("billing URL keeps the period and the deposit filter; defaults are left out", () => {
  const month = { kind: "month", month: "2026-11" } as const;
  assert.equal(billingHref(month, "2026-11", "all"), "/admin/billing");
  assert.equal(billingHref({ kind: "month", month: "2026-10" }, "2026-11", "paid", 2), "/admin/billing?month=2026-10&status=paid&page=2");
  assert.equal(billingHref({ kind: "year", year: "2026" }, "2026-11", "all"), "/admin/billing?period=year&year=2026");
  assert.equal(billingHref(month, "2026-11", "paid", 1, "idr"), "/admin/billing?currency=idr&status=paid");
});

test("currency: only idr switches, anything else is USD", () => {
  assert.equal(parseCurrency("idr"), "idr");
  for (const value of [undefined, "usd", "IDR", ["idr"], 1]) assert.equal(parseCurrency(value), "usd");
});
