import assert from "node:assert/strict";
import { test } from "node:test";
import { bodyBytes, buildMessages, clampParam, curlCommand, estimateTokens, requestBody } from "./playground-request.ts";

test("buildMessages adds a trimmed system prompt first and skips an empty one", () => {
  const history = [{ role: "user" as const, content: "Halo" }];
  assert.deepEqual(buildMessages("  Jawab singkat. ", history), [{ role: "system", content: "Jawab singkat." }, ...history]);
  assert.deepEqual(buildMessages("   ", history), history);
});

test("requestBody maps maxTokens to the API's max_tokens", () => {
  const body = requestBody({ model: "gpt-5", temperature: 0.7, maxTokens: 512 }, []);
  assert.deepEqual(body, { model: "gpt-5", messages: [], temperature: 0.7, max_tokens: 512 });
});

test("curlCommand escapes single quotes so the shell keeps the JSON whole", () => {
  const cmd = curlCommand("https://api.example.com/v1", { messages: [{ content: "it's" }] });
  assert.match(cmd, /it'\\''s/);
  assert.match(cmd, /\$NBYTES_API_KEY/);
  assert.match(cmd, /^curl https:\/\/api\.example\.com\/v1\/chat\/completions/);
});

test("estimateTokens rounds up and ignores surrounding space", () => {
  assert.equal(estimateTokens(""), 0);
  assert.equal(estimateTokens("   "), 0);
  assert.equal(estimateTokens("Hi"), 1);
  assert.equal(estimateTokens("  Halo dunia  "), 3);
});

test("bodyBytes counts UTF-8 bytes of the JSON, not characters", () => {
  assert.equal(bodyBytes({ a: "x" }), 9);
  assert.equal(bodyBytes({ a: "é" }), 10);
});

test("clampParam keeps typed parameters inside their range and precision", () => {
  assert.equal(clampParam(0.75, 0, 2, 1), 0.8);
  assert.equal(clampParam(5, 0, 2, 1), 2);
  assert.equal(clampParam(-1, 0, 2, 1), 0);
  assert.equal(clampParam(100.4, 64, 4096), 100);
  assert.equal(clampParam(10, 64, 4096), 64);
  assert.equal(clampParam(Number.NaN, 0, 2, 1), null);
});
