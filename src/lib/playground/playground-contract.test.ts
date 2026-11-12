import assert from "node:assert/strict";
import { test } from "node:test";
import { PLAYGROUND_MAX_MESSAGES, parsePlaygroundBody } from "./playground-contract.ts";

const valid = { model: "gpt-5", messages: [{ role: "system", content: "Singkat." }, { role: "user", content: "Halo" }],
  temperature: 0.7, max_tokens: 512 };

test("accepts exactly the Playground fields", () => {
  assert.deepEqual(parsePlaygroundBody(valid), valid);
  assert.deepEqual(parsePlaygroundBody({ ...valid, temperature: 0 })?.temperature, 0);
  assert.deepEqual(parsePlaygroundBody({ ...valid, temperature: 2 })?.temperature, 2);
});

test("refuses anything else", () => {
  const bad: unknown[] = [
    null, [], "x",
    { ...valid, stream: false },
    { ...valid, provider: "x" },
    { ...valid, model: "" },
    { ...valid, model: "m".repeat(201) },
    { ...valid, messages: [] },
    { ...valid, messages: Array.from({ length: PLAYGROUND_MAX_MESSAGES + 1 }, () => ({ role: "user", content: "a" })) },
    { ...valid, messages: [{ role: "tool", content: "x" }] },
    { ...valid, messages: [{ role: "user", content: [{ type: "image_url" }] }] },
    { ...valid, messages: [{ role: "user", content: "x", name: "y" }] },
    { ...valid, temperature: 2.1 },
    { ...valid, temperature: -0.1 },
    { ...valid, temperature: "0.7" },
    { ...valid, max_tokens: 0 },
    { ...valid, max_tokens: 1.5 },
  ];
  for (const body of bad) assert.equal(parsePlaygroundBody(body), null, JSON.stringify(body)?.slice(0, 80));
});
