import assert from "node:assert/strict";
import { test } from "node:test";
import { marginMicros, parseRequestQuery, requestsHref } from "./request-log-contract.ts";
import { parseSurplusBalance } from "./upstream-contract.ts";

test("margin only when charge and Surplus cost are both known; may be negative", () => {
  assert.equal(marginMicros({ chargeMicros: 5500, surplusCostMicros: 3750 }), 1750);
  assert.equal(marginMicros({ chargeMicros: 0, surplusCostMicros: 12 }), -12);
  assert.equal(marginMicros({ chargeMicros: 5500, surplusCostMicros: null }), null); // unknown is never 0
  assert.equal(marginMicros({ chargeMicros: null, surplusCostMicros: 10 }), null);
});

test("query from the URL and back", () => {
  const q = parseRequestQuery({ status: "failed", cost: "pending", q: "  opus " }, 2);
  assert.deepEqual(q, { filter: "failed", costPending: true, search: "opus", page: 2 });
  assert.equal(requestsHref(q, 2), "/admin/requests?q=opus&status=failed&cost=pending&page=2");
  assert.deepEqual(parseRequestQuery({ status: "weird", cost: "x", q: ["a"] }, 1), { filter: "all", costPending: false, search: null, page: 1 });
  assert.equal(requestsHref({ filter: "all", costPending: false, search: null }), "/admin/requests");
});

test("Surplus balance: digit strings in micro-USD (live shape, 2026-11-12)", () => {
  assert.deepEqual(parseSurplusBalance({ credit_balance_usdc: "12500000", auto_topup_enabled: false, account_status: "active" }), {
    creditMicros: 12_500_000, autoTopup: false, accountStatus: "active",
  });
  assert.deepEqual(parseSurplusBalance({ credit_balance_usdc: "0" }), { creditMicros: 0, autoTopup: null, accountStatus: null });
  for (const bad of [{ credit_balance_usdc: 5 }, { credit_balance_usdc: "-1" }, { credit_balance_usdc: "1.5" }, {}, null]) {
    assert.equal(parseSurplusBalance(bad), null, JSON.stringify(bad));
  }
});
