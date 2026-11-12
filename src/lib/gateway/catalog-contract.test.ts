import assert from "node:assert/strict";
import { test } from "node:test";
import { hasZeroListPrice, microsPerMToUsdPerToken, parseModelPriceBody, parseSurplusModel } from "./catalog-contract.ts";

// Trimmed copy of the live catalog entry (GET /v1/models, 2026-11-12).
const opus = {
  id: "claude-opus-4.6",
  name: "Claude Opus 4.6",
  context_length: 1_000_000,
  architecture: { modality: "text->text", input_modalities: ["text"], output_modalities: ["text"] },
  pricing: { prompt: "0.0000050000", completion: "0.0000250000", input_cache_read: "0.0000005000" },
  top_provider: { context_length: 1_000_000, max_completion_tokens: 128_000 },
  supported_features: ["streaming", "tools", "vision", "reasoning"],
  provider: "Anthropic",
};

test("live catalog entry -> list prices per 1M tokens; vision from supported_features", () => {
  assert.deepEqual(parseSurplusModel(opus), {
    modelId: "claude-opus-4.6", name: "Claude Opus 4.6", provider: "Anthropic", contextLength: 1_000_000, maxCompletionTokens: 128_000,
    supportsImages: true, listInputMicros: 5_000_000, listOutputMicros: 25_000_000,
  });
});

test("non-text output or unreadable prices are refused", () => {
  assert.equal(parseSurplusModel({ ...opus, architecture: { output_modalities: ["image"] } }), null);
  assert.equal(parseSurplusModel({ ...opus, pricing: { prompt: "-1", completion: "0.1" } }), null);
  assert.equal(parseSurplusModel({ ...opus, pricing: {} }), null);
  assert.equal(parseSurplusModel(null), null);
  const plain = parseSurplusModel({ ...opus, supported_features: [], top_provider: null });
  assert.equal(plain?.supportsImages, false);
  assert.equal(plain?.maxCompletionTokens, null);
});

test("admin body: id, markup within -99.99%..300%, active flag", () => {
  assert.deepEqual(parseModelPriceBody({ modelId: "claude-opus-4.6", markupBp: 0, active: true }), {
    modelId: "claude-opus-4.6", markupBp: 0, active: true,
  });
  assert.ok(parseModelPriceBody({ modelId: "a", markupBp: -9_999, active: false }));
  for (const body of [
    { modelId: "a", markupBp: -10_000, active: true }, { modelId: "a", markupBp: 30_001, active: true },
    { modelId: "a", markupBp: 1.5, active: true }, { modelId: "a b", markupBp: 0, active: true },
    { modelId: "a", markupBp: 0, active: "yes" }, { modelId: "", markupBp: 0, active: true }, null,
  ]) assert.equal(parseModelPriceBody(body), null, JSON.stringify(body));
});

test("sell price back to the catalog's USD-per-token form", () => {
  assert.equal(microsPerMToUsdPerToken(5_000_000), "0.000005000000");
  assert.equal(microsPerMToUsdPerToken(12_302), "0.000000012302");
});

test("a list price of 0 (input or output) is flagged", () => {
  const zero = parseSurplusModel({ ...opus, pricing: { prompt: "0.0000000000", completion: "0" } });
  assert.ok(zero && hasZeroListPrice(zero));
  assert.equal(hasZeroListPrice({ listInputMicros: 5, listOutputMicros: 0 }), true);
  assert.equal(hasZeroListPrice({ listInputMicros: 5, listOutputMicros: 1 }), false);
});
