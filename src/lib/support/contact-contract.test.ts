import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_CONTACTS, contactErrors, contactHref, normalizeContact, parseContactBody } from "./contact-contract.ts";

test("WhatsApp: international digits only, 8-15, never a leading 0", () => {
  assert.equal(normalizeContact("whatsapp", "+62 812-3456-7890"), "6281234567890");
  assert.equal(normalizeContact("whatsapp", "6281234567890"), "6281234567890");
  for (const bad of ["081234567890", "62812", "+62 812 abc", "1234567890123456"]) {
    assert.equal(normalizeContact("whatsapp", bad), null, bad);
  }
});

test("Telegram: username 5-32 of letters, digits, _; @ and t.me/ are dropped", () => {
  assert.equal(normalizeContact("telegram", "@nbytes_support"), "nbytes_support");
  assert.equal(normalizeContact("telegram", "https://t.me/nbytes_support"), "nbytes_support");
  for (const bad of ["abcd", "nbytes support", "nbytes-support", "a".repeat(33)]) {
    assert.equal(normalizeContact("telegram", bad), null, bad);
  }
});

test("email uses the sign-in rule and is lower-cased", () => {
  assert.equal(normalizeContact("email", " Support@NBytes.id "), "support@nbytes.id");
  assert.equal(normalizeContact("email", "support@"), null);
});

test("links open the channel", () => {
  assert.equal(contactHref("whatsapp", "6281234567890"), "https://wa.me/6281234567890");
  assert.equal(contactHref("telegram", "nbytes_support"), "https://t.me/nbytes_support");
  assert.equal(contactHref("email", "support@nbytes.id"), "mailto:support@nbytes.id");
});

test("a shown channel needs a value; a hidden one may be empty but not invalid", () => {
  assert.deepEqual(contactErrors({ ...EMPTY_CONTACTS, email: { value: "", visible: true } }), { email: "required" });
  assert.deepEqual(contactErrors({ ...EMPTY_CONTACTS, telegram: { value: "ab", visible: false } }), { telegram: "invalid" });
  assert.deepEqual(contactErrors(EMPTY_CONTACTS), {});
});

test("body: all three channels, normalized; anything else is refused", () => {
  const body = {
    whatsapp: { value: "+62 812-3456-7890", visible: true },
    telegram: { value: "", visible: false },
    email: { value: "Support@NBytes.id", visible: false },
  };
  assert.deepEqual(parseContactBody(body), {
    whatsapp: { value: "6281234567890", visible: true },
    telegram: { value: "", visible: false },
    email: { value: "support@nbytes.id", visible: false },
  });
  assert.equal(parseContactBody({ ...body, email: undefined }), null);
  assert.equal(parseContactBody({ ...body, telegram: { value: "", visible: "yes" } }), null);
  assert.equal(parseContactBody({ ...body, email: { value: "", visible: true } }), null);
  assert.equal(parseContactBody(null), null);
});
