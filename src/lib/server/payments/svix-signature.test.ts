// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { signSvix, verifySvix } from "./svix-signature.ts";

const KEY = Buffer.from("nbytes-test-signing-key-32-bytes!", "ascii");
const SECRET = `whsec_${KEY.toString("base64")}`;
const BODY = '{"event_type":"payment.test"}';
const NOW = 1_800_000_000_000;
const TS = String(NOW / 1000);

test("signature matches Sumopod's Node.js example", () => {
  // Same steps as the dashboard sample: strip whsec_, base64-decode, HMAC "{id}.{ts}.{body}", base64.
  const sample = createHmac("sha256", KEY).update(`msg_1.${TS}.${BODY}`).digest("base64");
  assert.equal(signSvix(SECRET, "msg_1", TS, BODY), sample);
});

test("accepts a valid signature, also among several (secret rotation)", () => {
  const sig = signSvix(SECRET, "msg_1", TS, BODY);
  assert.equal(verifySvix(SECRET, { id: "msg_1", timestamp: TS, signature: `v1,${sig}` }, BODY, NOW), true);
  const both = `v1,${Buffer.alloc(32).toString("base64")} v1,${sig}`;
  assert.equal(verifySvix(SECRET, { id: "msg_1", timestamp: TS, signature: both }, BODY, NOW), true);
});

test("refuses a changed body, id, wrong secret or wrong version", () => {
  const sig = `v1,${signSvix(SECRET, "msg_1", TS, BODY)}`;
  assert.equal(verifySvix(SECRET, { id: "msg_1", timestamp: TS, signature: sig }, `${BODY} `, NOW), false);
  assert.equal(verifySvix(SECRET, { id: "msg_2", timestamp: TS, signature: sig }, BODY, NOW), false);
  const other = `whsec_${Buffer.from("another-key").toString("base64")}`;
  assert.equal(verifySvix(other, { id: "msg_1", timestamp: TS, signature: sig }, BODY, NOW), false);
  assert.equal(verifySvix(SECRET, { id: "msg_1", timestamp: TS, signature: sig.replace("v1,", "v2,") }, BODY, NOW), false);
  assert.equal(verifySvix(SECRET, { id: "msg_1", timestamp: TS, signature: "v1,short" }, BODY, NOW), false);
});

test("refuses a timestamp more than 5 minutes away or not a number", () => {
  const at = (ts: string) => ({ id: "msg_1", timestamp: ts, signature: `v1,${signSvix(SECRET, "msg_1", ts, BODY)}` });
  assert.equal(verifySvix(SECRET, at(String(NOW / 1000 - 300)), BODY, NOW), true);
  assert.equal(verifySvix(SECRET, at(String(NOW / 1000 - 301)), BODY, NOW), false);
  assert.equal(verifySvix(SECRET, at(String(NOW / 1000 + 301)), BODY, NOW), false);
  assert.equal(verifySvix(SECRET, at("abc"), BODY, NOW), false);
});
