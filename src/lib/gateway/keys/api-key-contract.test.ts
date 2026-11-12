import assert from "node:assert/strict";
import { test } from "node:test";
import { budgetState, parseCreateKeyBody, readApiKey } from "./api-key-contract.ts";

test("create body: trimmed name up to 40, optional budget in micro-USD", () => {
  assert.deepEqual(parseCreateKeyBody({ name: "  Produksi " }), { name: "Produksi", monthlyBudgetMicros: null });
  assert.deepEqual(parseCreateKeyBody({ name: "a".repeat(40), monthlyBudgetMicros: 50_000_000 }), {
    name: "a".repeat(40), monthlyBudgetMicros: 50_000_000,
  });
  for (const body of [
    { name: "" }, { name: "   " }, { name: "a".repeat(41) }, { name: 5 }, { name: "x", monthlyBudgetMicros: 0 },
    { name: "x", monthlyBudgetMicros: 1.5 }, { name: "x", monthlyBudgetMicros: "50" }, null, ["x"],
  ]) assert.equal(parseCreateKeyBody(body), null, JSON.stringify(body));
});

test("key from Bearer or x-api-key, only with the nbk_ prefix", () => {
  assert.equal(readApiKey(new Headers({ authorization: "Bearer nbk_abc" })), "nbk_abc");
  assert.equal(readApiKey(new Headers({ "x-api-key": "nbk_abc" })), "nbk_abc");
  assert.equal(readApiKey(new Headers({ authorization: "Bearer sk-abc" })), null);
  assert.equal(readApiKey(new Headers({ authorization: "Basic nbk_abc" })), null);
  assert.equal(readApiKey(new Headers()), null);
  assert.equal(readApiKey(new Headers({ authorization: `Bearer nbk_${"a".repeat(200)}` })), null);
});

test("budget state: none without a budget, near from 85%, reached at the budget", () => {
  assert.equal(budgetState(5_000_000, null), "none");
  assert.equal(budgetState(0, 50_000_000), "ok");
  assert.equal(budgetState(42_499_999, 50_000_000), "ok");
  assert.equal(budgetState(42_500_000, 50_000_000), "near");
  assert.equal(budgetState(50_000_000, 50_000_000), "reached");
  assert.equal(budgetState(60_000_000, 50_000_000), "reached");
  assert.equal(budgetState(1_000_000_000_000, 1_000_000_000_000), "reached");
});
