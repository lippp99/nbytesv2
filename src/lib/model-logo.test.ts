import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { modelLogo } from "./model-logo.ts";

test("family name in the id or catalog name picks the logo", () => {
  assert.equal(modelLogo("deepseek-v3.1"), "deepseek");
  assert.equal(modelLogo("claude-fable-5"), "claude");
  assert.equal(modelLogo("e2ee-gpt-oss-120b-p"), "openai");
  assert.equal(modelLogo("e2ee-gemma-4-26b-a4b-uncensored-p"), "google");
  assert.equal(modelLogo("devstral-2-123b"), "mistral");
  assert.equal(modelLogo("e2ee-glm-5-2-p"), "chatglm");
  assert.equal(modelLogo("x-1", "Qwen3 Max"), "qwen");
});

test("no matching family means no logo", () => {
  assert.equal(modelLogo("command-a-plus"), null);
  assert.equal(modelLogo("ember-1", null), null);
});

test("every logo a rule can return exists in public/models", () => {
  const ids = ["claude", "gpt", "gemini", "gemma", "deepseek", "qwen", "mistral", "llama", "grok", "kimi", "moonshot", "glm", "hermes"];
  for (const id of ids) {
    const logo = modelLogo(id);
    assert.ok(logo && existsSync(new URL(`../../public/models/${logo}.svg`, import.meta.url)), id);
  }
});
