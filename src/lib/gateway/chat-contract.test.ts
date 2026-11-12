import assert from "node:assert/strict";
import { test } from "node:test";
import { parseChatBody } from "./chat-contract.ts";

const base = { model: "claude-opus-4.6", messages: [{ role: "user", content: "hi" }] };

test("valid body passes through, routing fields removed (A2)", () => {
  const parsed = parseChatBody({ ...base, temperature: 0.2, provider: "x", si_route: "y", min_discount_pct: 0 });
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value.upstreamBody, { ...base, temperature: 0.2 });
  assert.equal(parsed.value.stream, false);
  assert.equal(parsed.value.maxTokens, null);
  assert.equal(parsed.value.hasImage, false);
});

test("streaming always asks for usage, keeping the user's other stream options", () => {
  const parsed = parseChatBody({ ...base, stream: true, stream_options: { include_usage: false, extra: 1 } });
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value.upstreamBody.stream_options, { include_usage: true, extra: 1 });
});

test("max_completion_tokens wins over max_tokens", () => {
  const parsed = parseChatBody({ ...base, max_tokens: 100, max_completion_tokens: 50 });
  assert.ok(parsed.ok);
  assert.equal(parsed.value.maxTokens, 50);
});

test("image parts are detected", () => {
  const messages = [{ role: "user", content: [{ type: "text", text: "x" }, { type: "image_url", image_url: { url: "u" } }] }];
  const parsed = parseChatBody({ ...base, messages });
  assert.ok(parsed.ok);
  assert.equal(parsed.value.hasImage, true);
});

test("refusals name the field", () => {
  const cases: [unknown, string | null][] = [
    [null, null], [[base], null],
    [{ ...base, model: "" }, "model"], [{ ...base, model: 5 }, "model"],
    [{ ...base, messages: [] }, "messages"], [{ ...base, messages: ["hi"] }, "messages"],
    [{ ...base, stream: "true" }, "stream"],
    [{ ...base, max_tokens: 0 }, "max_tokens"], [{ ...base, max_completion_tokens: 1.5 }, "max_completion_tokens"],
    [{ ...base, stream_options: true }, "stream_options"],
  ];
  for (const [body, param] of cases) assert.deepEqual(parseChatBody(body), { ok: false, param }, JSON.stringify(body));
});
