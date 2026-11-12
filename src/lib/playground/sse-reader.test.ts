import assert from "node:assert/strict";
import { test } from "node:test";
import { readEvent, splitSse } from "./sse-reader.ts";

test("splitSse keeps a line cut in the middle for the next chunk", () => {
  const first = splitSse('data: {"a":1}\n\ndata: {"b"');
  assert.deepEqual(first, { data: ['{"a":1}'], rest: 'data: {"b"' });
  const second = splitSse(`${first.rest}:2}\r\n\r\n: comment\ndata: [DONE]\n`);
  assert.deepEqual(second, { data: ['{"b":2}', "[DONE]"], rest: "" });
});

test("readEvent: delta, usage, error, done, junk", () => {
  assert.deepEqual(readEvent('{"choices":[{"delta":{"content":"Hal"}}]}'), { delta: "Hal" });
  assert.deepEqual(readEvent('{"choices":[{"delta":{"role":"assistant"}}]}'), {});
  assert.deepEqual(readEvent('{"choices":[],"usage":{"prompt_tokens":12,"completion_tokens":34}}'), { usage: { input: 12, output: 34 } });
  assert.deepEqual(readEvent('{"choices":[{"delta":{"content":"!"}}],"usage":null}'), { delta: "!" });
  assert.deepEqual(readEvent('{"error":{"message":"x"}}'), { error: true });
  assert.deepEqual(readEvent("[DONE]"), { done: true });
  assert.deepEqual(readEvent("not json"), {});
  assert.deepEqual(readEvent("null"), {});
});
