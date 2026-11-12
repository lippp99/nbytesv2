// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import { base32Decode, base32Encode, hotp, otpauthUrl, timeStep, verifyTotp } from "./totp.ts";

// RFC 6238 Appendix B, SHA-1 rows: secret is the ASCII string "12345678901234567890", 8-digit values.
const RFC_KEY = Buffer.from("12345678901234567890", "ascii");
const RFC_VECTORS: [number, string][] = [
  [59, "94287082"],
  [1111111109, "07081804"],
  [1111111111, "14050471"],
  [1234567890, "89005924"],
  [2000000000, "69279037"],
  [20000000000, "65353130"],
];

test("RFC 6238 Appendix B vectors (SHA-1, 8 digits)", () => {
  for (const [seconds, code] of RFC_VECTORS) assert.equal(hotp(RFC_KEY, timeStep(seconds * 1000), 8), code, `T=${seconds}`);
});

test("6-digit codes are the last 6 digits of the RFC vectors and verify at their time", () => {
  for (const [seconds, code] of RFC_VECTORS) {
    const six = code.slice(-6);
    assert.equal(hotp(RFC_KEY, timeStep(seconds * 1000)), six);
    assert.equal(verifyTotp(RFC_KEY, six, seconds * 1000, null), timeStep(seconds * 1000));
  }
});

test("±1 step is accepted, ±2 is not", () => {
  const now = 1234567890_000;
  const step = timeStep(now);
  assert.equal(verifyTotp(RFC_KEY, hotp(RFC_KEY, step - 1), now, null), step - 1);
  assert.equal(verifyTotp(RFC_KEY, hotp(RFC_KEY, step + 1), now, null), step + 1);
  assert.equal(verifyTotp(RFC_KEY, hotp(RFC_KEY, step - 2), now, null), null);
  assert.equal(verifyTotp(RFC_KEY, hotp(RFC_KEY, step + 2), now, null), null);
  assert.equal(verifyTotp(RFC_KEY, "12345", now, null), null, "wrong length");
});

test("anti-replay: a step at or before the last used step is refused", () => {
  const now = 1234567890_000;
  const step = timeStep(now);
  const code = hotp(RFC_KEY, step);
  assert.equal(verifyTotp(RFC_KEY, code, now, step - 1), step);
  assert.equal(verifyTotp(RFC_KEY, code, now, step), null, "same code twice");
  assert.equal(verifyTotp(RFC_KEY, hotp(RFC_KEY, step - 1), now, step), null, "older code after a newer one");
});

test("base32 matches RFC 4648 and round-trips", () => {
  assert.equal(base32Encode(Buffer.from("foobar")), "MZXW6YTBOI");
  assert.equal(base32Encode(Buffer.from("f")), "MY");
  assert.equal(base32Encode(RFC_KEY), "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.equal(base32Decode("mzxw 6ytb oi==").toString(), "foobar");
  for (let n = 0; n < 50; n++) {
    const bytes = Buffer.from(Array.from({ length: n }, (_, i) => (i * 37 + n) & 0xff));
    assert.deepEqual(base32Decode(base32Encode(bytes)), bytes);
  }
  assert.throws(() => base32Decode("ABC1"));
});

test("otpauth URL has issuer label and parameter", () => {
  assert.equal(
    otpauthUrl("a@b.co", "ABC"),
    "otpauth://totp/nbytes%20Admin:a%40b.co?secret=ABC&issuer=nbytes%20Admin",
  );
});
