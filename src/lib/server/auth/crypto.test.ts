// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import { equalHex, hmac, randomOtp, randomToken, sha256 } from "./crypto.ts";

test("randomOtp is always 8 digits, leading zeros included", () => {
  const codes = Array.from({ length: 5000 }, randomOtp);
  for (const code of codes) assert.match(code, /^\d{8}$/);
  assert.ok(codes.some((code) => code.startsWith("0")), "expected some codes with a leading zero");
  assert.ok(new Set(codes).size > 4990, "codes should not repeat often");
});

test("hmac is deterministic and keyed", () => {
  const key = Buffer.alloc(32, 1);
  assert.equal(hmac(key, "x"), hmac(key, "x"));
  assert.notEqual(hmac(key, "x"), hmac(Buffer.alloc(32, 2), "x"));
  assert.match(sha256("t"), /^[0-9a-f]{64}$/);
});

test("equalHex compares digests", () => {
  const a = sha256("a");
  assert.equal(equalHex(a, sha256("a")), true);
  assert.equal(equalHex(a, sha256("b")), false);
  assert.equal(equalHex(a, a.slice(0, 10)), false);
});

test("randomToken has 32 bytes of entropy", () => {
  assert.equal(Buffer.from(randomToken(), "base64url").length, 32);
});
