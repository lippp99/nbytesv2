import assert from "node:assert/strict";
import { test } from "node:test";
import { ADMIN_OTP_LENGTH, TOTP_LENGTH, isDigits, sanitizeDigits } from "./admin-auth-contract.ts";

test("sanitizeDigits strips separators and caps the length", () => {
  assert.equal(sanitizeDigits("12345-67890", ADMIN_OTP_LENGTH), "1234567890");
  assert.equal(sanitizeDigits("12345 678901", ADMIN_OTP_LENGTH), "1234567890");
  assert.equal(sanitizeDigits("123 456", TOTP_LENGTH), "123456");
  assert.equal(sanitizeDigits("abc", TOTP_LENGTH), "");
});

test("isDigits requires exactly the given number of digits", () => {
  assert.equal(isDigits("1234567890", ADMIN_OTP_LENGTH), true);
  assert.equal(isDigits("123456789", ADMIN_OTP_LENGTH), false);
  assert.equal(isDigits("12345a", TOTP_LENGTH), false);
  assert.equal(isDigits("123456", TOTP_LENGTH), true);
});
