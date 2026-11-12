// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import { open, seal } from "./secret-box.ts";

const key = Buffer.alloc(32, 7);

test("seal/open round-trips and uses a fresh IV each time", () => {
  const secret = Buffer.from("12345678901234567890");
  const a = seal(key, secret);
  assert.deepEqual(open(key, a), secret);
  assert.notEqual(a, seal(key, secret));
  assert.ok(!a.includes(secret.toString("base64")), "plain secret not visible");
});

test("wrong key or changed data is refused", () => {
  const sealed = seal(key, Buffer.from("secret"));
  assert.throws(() => open(Buffer.alloc(32, 8), sealed));
  const bytes = Buffer.from(sealed, "base64");
  bytes[bytes.length - 1] ^= 1;
  assert.throws(() => open(key, bytes.toString("base64")));
});
