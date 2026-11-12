import assert from "node:assert/strict";
import { test } from "node:test";
import { gatewayErrors } from "../../../lib/gateway/error-contract.ts";
import { PLAYGROUND_ONLY_CODES, buildErrorTexts } from "./docs-errors.ts";

test("every public error code of the contract has Indonesian text, and nothing extra", () => {
  const texts = buildErrorTexts("120 request per 60 detik", 10);
  const publicCodes = gatewayErrors.map((e) => e.code).filter((c) => !PLAYGROUND_ONLY_CODES.includes(c));
  assert.deepEqual(Object.keys(texts).sort(), [...publicCodes].sort());
  for (const code of publicCodes) {
    const text = texts[code as keyof typeof texts];
    assert.ok(text.meaning && text.action, code);
  }
});

test("limits are filled in from the arguments", () => {
  const texts = buildErrorTexts("120 request per 60 detik", 10);
  assert.match(texts.rate_limited.meaning, /120 request per 60 detik/);
  assert.match(texts.request_too_large.meaning, /10 MB/);
});
