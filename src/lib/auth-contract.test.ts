import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidEmail, isValidOtp, maskEmail, sanitizeOtp } from "./auth-contract.ts";

test("isValidEmail accepts basic addresses and trims", () => {
  assert.equal(isValidEmail("andi@example.com"), true);
  assert.equal(isValidEmail("  Andi@Example.com "), true);
  assert.equal(isValidEmail("andi@example"), false);
  assert.equal(isValidEmail("andi example.com"), false);
  assert.equal(isValidEmail(`${"a".repeat(250)}@x.co`), false);
});

test("sanitizeOtp strips separators from pasted codes", () => {
  assert.equal(sanitizeOtp("1234-5678"), "12345678");
  assert.equal(sanitizeOtp("1234 5678"), "12345678");
  assert.equal(sanitizeOtp("12345678"), "12345678");
  assert.equal(sanitizeOtp("123456789"), "12345678");
  assert.equal(sanitizeOtp("ab"), "");
});

test("isValidOtp requires exactly 8 digits", () => {
  assert.equal(isValidOtp("12345678"), true);
  assert.equal(isValidOtp("1234567"), false);
  assert.equal(isValidOtp("1234567a"), false);
});

test("maskEmail keeps first letter and domain", () => {
  assert.equal(maskEmail("andi@domain.com"), "a***@domain.com");
  assert.equal(maskEmail("invalid"), "invalid");
});
