import assert from "node:assert/strict";
import { test } from "node:test";
import { depositState, parseDepositFilter } from "./finance-contract.ts";

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
