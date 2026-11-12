import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ADMIN_OTP_LENGTH, TOTP_LENGTH, formatBackupCode, isDigits, normalizeBackupCode, parseAdminCodeBody, parseAdminEmailBody,
  parseSecondFactorBody, sanitizeDigits,
} from "./admin-auth-contract.ts";

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

test("backup codes: 5-5 format round-trips, look-alike characters are refused", () => {
  assert.equal(normalizeBackupCode("abcde-fghjk"), "ABCDEFGHJK");
  assert.equal(normalizeBackupCode(formatBackupCode("ABCDEFGHJK")), "ABCDEFGHJK");
  assert.equal(normalizeBackupCode("ABCDE-FGHJ0"), null, "0 is not in the alphabet");
  assert.equal(normalizeBackupCode("ABCDE-FGHJI"), null, "I is not in the alphabet");
  assert.equal(normalizeBackupCode("ABCDE-FGHJ"), null);
});

test("API bodies: email, email code, second factor", () => {
  assert.deepEqual(parseAdminEmailBody({ email: " A@B.co ", extra: true }), { email: "a@b.co" });
  assert.equal(parseAdminEmailBody({ email: "bad" }), null);
  assert.deepEqual(parseAdminCodeBody({ email: " A@B.co ", code: "0123456789" }), { email: "a@b.co", code: "0123456789" });
  assert.equal(parseAdminCodeBody({ email: "a@b.co", code: "12345-67890" }), null);
  assert.deepEqual(parseSecondFactorBody({ code: "012345" }), { kind: "totp", code: "012345" });
  assert.deepEqual(parseSecondFactorBody({ code: "abcde-fghjk" }), { kind: "backup", code: "ABCDEFGHJK" });
  assert.equal(parseSecondFactorBody({ code: "1234567" }), null);
});
