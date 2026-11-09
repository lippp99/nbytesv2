import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isValidEmail, isValidOtp, maskEmail, parseOtpRequestBody, parseOtpVerifyBody, parsePageParam, parseRevokeBody,
  safeNextPath, sanitizeOtp,
} from "./auth-contract.ts";

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

test("parseOtpRequestBody normalizes email and keeps only it", () => {
  assert.deepEqual(parseOtpRequestBody({ email: "  Andi@X.com " }), { email: "andi@x.com" });
  // Old clients may still send a mode; it is ignored, not an error.
  assert.deepEqual(parseOtpRequestBody({ email: "a@x.co", mode: "register" }), { email: "a@x.co" });
  assert.equal(parseOtpRequestBody({ email: "broken" }), null);
  assert.equal(parseOtpRequestBody(null), null);
  assert.equal(parseOtpRequestBody(["a@x.co"]), null);
});

test("parseOtpVerifyBody requires an 8-digit code", () => {
  assert.deepEqual(parseOtpVerifyBody({ email: "A@x.co", code: "01234567" }), { email: "a@x.co", code: "01234567", next: null });
  assert.deepEqual(parseOtpVerifyBody({ email: "a@x.co", code: "01234567", next: "/usage" })?.next, "/usage");
  assert.equal(parseOtpVerifyBody({ email: "a@x.co", code: "1234 5678" }), null);
  assert.equal(parseOtpVerifyBody({ email: "a@x.co", code: 12345678 }), null);
  assert.equal(parseOtpVerifyBody({ email: "a@x.co", code: "12345678", next: 5 }), null);
});

test("safeNextPath only allows dashboard paths on this site", () => {
  assert.equal(safeNextPath("/usage"), "/usage");
  assert.equal(safeNextPath("/api-keys/new"), "/api-keys/new");
  assert.equal(safeNextPath("/sessions"), "/sessions");
  for (const bad of ["//evil.com", "/\evil.com", "https://evil.com", "/%2F%2Fevil.com", "/usage//x",
    "/", "/login", "/admin", "/usage-old", "/usage?x=1", "/usage\n", "javascript:alert(1)", "", null, 7]) {
    assert.equal(safeNextPath(bad), null, String(bad));
  }
});

test("parseRevokeBody accepts only a session uuid", () => {
  const id = "3F2504E0-4F89-41D3-9A0C-0305E82C3301";
  assert.deepEqual(parseRevokeBody({ sessionId: id }), { sessionId: id.toLowerCase() });
  for (const bad of [{}, { sessionId: 5 }, { sessionId: "abc" }, { sessionId: `${id}x` }, null, [id]]) {
    assert.equal(parseRevokeBody(bad), null, JSON.stringify(bad));
  }
});

test("parsePageParam falls back to page 1 for anything that is not a positive whole number", () => {
  assert.equal(parsePageParam("3"), 3);
  for (const bad of [undefined, "", "0", "-1", "2.5", "abc", "1e3", ["2"], "9999999"]) {
    assert.equal(parsePageParam(bad), 1, String(bad));
  }
});
