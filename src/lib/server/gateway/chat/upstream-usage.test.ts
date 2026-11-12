// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import { SseUsageTap, readUsage, stripUpstream } from "./upstream-usage.ts";

test("usage from the documented non-streaming example [S6]", () => {
  const body = { choices: [], usage: { prompt_tokens: 596, completion_tokens: 2266, buyer_cost_micro: 2132 } };
  assert.deepEqual(readUsage(body), { inputTokens: 596, outputTokens: 2266, costMicros: 2132 });
  assert.deepEqual(readUsage({ usage: { prompt_tokens: 1, completion_tokens: 2 } }), { inputTokens: 1, outputTokens: 2, costMicros: null });
  assert.deepEqual(readUsage({ usage: { prompt_tokens: 1, completion_tokens: 2, buyer_cost_micro: "77" } })?.costMicros, 77);
  assert.equal(readUsage({ usage: { prompt_tokens: -1, completion_tokens: 2 } }), null);
  assert.equal(readUsage({ choices: [] }), null);
});

test("cost fields and the surplus object never reach the user", () => {
  const body = { id: "x", surplus: { served_by: "p" }, usage: { prompt_tokens: 1, completion_tokens: 2, buyer_cost_micro: 5 } };
  assert.deepEqual(stripUpstream(body), { id: "x", usage: { prompt_tokens: 1, completion_tokens: 2 } });
});

test("SSE: bytes pass through, the usage event is read and cleaned, split chunks are handled", () => {
  const tap = new SseUsageTap();
  const usageEvent = 'data: {"choices":[],"usage":{"prompt_tokens":3,"completion_tokens":4,"buyer_cost_micro":9}}\n\n';
  const input = `: ping\n\ndata: {"choices":[{"delta":{"content":"Hi"}}]}\r\n\r\n${usageEvent}data: [DONE]\n\n`;
  let out = "";
  for (let i = 0; i < input.length; i += 7) out += tap.push(input.slice(i, i + 7)); // odd chunk size on purpose
  out += tap.flush();
  assert.deepEqual(tap.usage, { inputTokens: 3, outputTokens: 4, costMicros: 9 });
  assert.equal(out, input.replace(',"buyer_cost_micro":9', ""));
});

test("SSE: a last line without newline is flushed; bad JSON passes unchanged", () => {
  const tap = new SseUsageTap();
  assert.equal(tap.push('data: {"usage": broken\ndata: [DONE]'), 'data: {"usage": broken\n');
  assert.equal(tap.flush(), "data: [DONE]");
  assert.equal(tap.usage, null);
});
