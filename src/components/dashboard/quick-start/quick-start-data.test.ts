import assert from "node:assert/strict";
import { test } from "node:test";
import type { CatalogModel } from "../../../lib/gateway/catalog-contract.ts";
import { cheapestModels, stepStates } from "./quick-start-data.ts";

const none = { hasKey: false, hasBalance: false, firstRequest: false, budgetSet: false };

test("new account: key is the current step", () => {
  assert.deepEqual(stepStates(none), { account: "done", key: "current", balance: "todo", request: "todo", budget: "todo" });
});

test("each fact moves the current step on", () => {
  assert.equal(stepStates({ ...none, hasKey: true }).balance, "current");
  assert.equal(stepStates({ ...none, hasKey: true, hasBalance: true }).request, "current");
  assert.equal(stepStates({ hasKey: true, hasBalance: true, firstRequest: true, budgetSet: false }).budget, "current");
});

test("all done: no current step", () => {
  const all = stepStates({ hasKey: true, hasBalance: true, firstRequest: true, budgetSet: true });
  assert.ok(Object.values(all).every((s) => s === "done"));
});

test("a later fact without the earlier one: earlier step stays current, later shows done", () => {
  const s = stepStates({ ...none, budgetSet: true });
  assert.equal(s.key, "current");
  assert.equal(s.budget, "done");
});

const m = (id: string, inputMicros: number, outputMicros: number): CatalogModel => ({
  id, name: id, contextLength: null, maxCompletionTokens: null, supportsImages: false, inputMicros, outputMicros,
});

test("cheapest: input price first, then output, then name; at most n", () => {
  const list = [m("c", 300, 1), m("a", 100, 9), m("b", 100, 5), m("d", 50, 50), m("e", 400, 1), m("f", 500, 1)];
  assert.deepEqual(cheapestModels(list).map((x) => x.id), ["d", "b", "a", "c", "e"]);
  assert.deepEqual(cheapestModels(list, 2).map((x) => x.id), ["d", "b"]);
  assert.deepEqual(cheapestModels([]), []);
  assert.equal(list[0].id, "c", "input not mutated");
});
