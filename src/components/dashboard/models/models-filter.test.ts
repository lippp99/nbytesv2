import assert from "node:assert/strict";
import { test } from "node:test";
import type { CatalogModel } from "../../../lib/gateway/catalog-contract.ts";
import { filterModels, formatTokens, sortModels } from "./models-filter.ts";

const model = (id: string, name: string, inputMicros: number, outputMicros: number): CatalogModel => ({
  id, name, contextLength: null, maxCompletionTokens: null, supportsImages: false, inputMicros, outputMicros,
});
const a = model("claude-opus-4.6", "Claude Opus 4.6", 15_000_000, 75_000_000);
const b = model("gpt-5", "GPT-5", 1_250_000, 10_000_000);
const c = model("deepseek-v3.2", "DeepSeek V3.2", 1_250_000, 420_000);
const all = [a, c, b];

test("search matches name or id, any case, trimmed", () => {
  assert.deepEqual(filterModels(all, ""), all);
  assert.deepEqual(filterModels(all, "  OPUS "), [a]);
  assert.deepEqual(filterModels(all, "gpt-5"), [b]);
  assert.deepEqual(filterModels(all, "v3.2"), [c]);
  assert.deepEqual(filterModels(all, "llama"), []);
});

test("sort keeps server order by name, prices cheapest first with name as tie-break", () => {
  assert.equal(sortModels(all, "name"), all);
  assert.deepEqual(sortModels(all, "input").map((m) => m.id), ["deepseek-v3.2", "gpt-5", "claude-opus-4.6"]);
  assert.deepEqual(sortModels(all, "output").map((m) => m.id), ["deepseek-v3.2", "gpt-5", "claude-opus-4.6"]);
  assert.deepEqual(all.map((m) => m.id), ["claude-opus-4.6", "deepseek-v3.2", "gpt-5"], "input not mutated");
});

test("token columns: unknown shows an em dash", () => {
  assert.equal(formatTokens(null, String), "—");
  assert.equal(formatTokens(200_000, (n) => `${n / 1000}K`), "200K");
});
