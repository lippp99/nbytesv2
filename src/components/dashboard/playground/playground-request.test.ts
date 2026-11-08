import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMessages, curlCommand, requestBody } from "./playground-request.ts";

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
