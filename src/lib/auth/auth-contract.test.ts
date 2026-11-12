import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isValidEmail, isValidName, isValidOtp, maskEmail, parseModeParam, parseOtpRequestBody, parseOtpVerifyBody,
  parseDeleteAccountBody, parseDeleteRequestBody, parsePageParam, parseProfileBody, parseRevokeBody, safeNextPath,
  sanitizeOtp,
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

test("isValidName allows letters of any script with inner spaces, apostrophes, hyphens, dots", () => {
  for (const ok of ["Siti", " Siti  Aisyah ", "O'Brien", "Jean-Luc", "Muh. Rizki", "Zoë", "李", "a".repeat(50)]) {
    assert.equal(isValidName(ok), true, ok);
  }
  for (const bad of ["", "   ", "-Andi", "Andi1", "<b>", "a\u0000b", "😀", "a".repeat(51)]) {
    assert.equal(isValidName(bad), false, bad);
  }
});

test("parseModeParam opens register only for ?mode=register", () => {
  assert.equal(parseModeParam("register"), "register");
  for (const other of ["login", "REGISTER", undefined, ["register"]]) assert.equal(parseModeParam(other), "login");
});

test("parseOtpRequestBody requires a tab and a valid email", () => {
  assert.deepEqual(parseOtpRequestBody({ mode: "login", email: "  Andi@X.com " }), { mode: "login", email: "andi@x.com" });
  assert.deepEqual(parseOtpRequestBody({ mode: "register", email: "a@x.co", firstName: "x" }), { mode: "register", email: "a@x.co" });
  for (const bad of [{ email: "a@x.co" }, { mode: "signup", email: "a@x.co" }, { mode: "login", email: "broken" }, null, ["a@x.co"]]) {
    assert.equal(parseOtpRequestBody(bad), null, JSON.stringify(bad));
  }
});

test("parseOtpVerifyBody requires an 8-digit code, and names on the register tab", () => {
  const login = { mode: "login", email: "A@x.co", code: "01234567" };
  assert.deepEqual(parseOtpVerifyBody(login), { mode: "login", email: "a@x.co", code: "01234567", next: null });
  assert.deepEqual(parseOtpVerifyBody({ ...login, firstName: "x" }), { mode: "login", email: "a@x.co", code: "01234567", next: null });
  assert.equal(parseOtpVerifyBody({ ...login, next: "/usage" })?.next, "/usage");
  assert.equal(parseOtpVerifyBody({ ...login, code: "1234 5678" }), null);
  assert.equal(parseOtpVerifyBody({ ...login, code: 12345678 }), null);
  assert.equal(parseOtpVerifyBody({ ...login, next: 5 }), null);
  assert.equal(parseOtpVerifyBody({ email: "a@x.co", code: "01234567" }), null, "tab is required");

  const register = { ...login, mode: "register", firstName: "  Siti ", lastName: "Aisyah  Putri" };
  assert.deepEqual(parseOtpVerifyBody(register), {
    mode: "register", firstName: "Siti", lastName: "Aisyah Putri", email: "a@x.co", code: "01234567", next: null,
  });
  for (const blank of [undefined, null, "", "   "]) {
    const parsed = parseOtpVerifyBody({ ...register, lastName: blank });
    assert.equal(parsed?.mode === "register" && parsed.lastName, null, `optional: ${String(blank)}`);
  }
  assert.equal(parseOtpVerifyBody({ ...register, lastName: "Doe1" }), null, "filled last name must be valid");
  assert.equal(parseOtpVerifyBody({ ...register, lastName: 5 }), null);
  assert.equal(parseOtpVerifyBody({ ...register, firstName: "" }), null);
  assert.equal(parseOtpVerifyBody({ ...register, firstName: 5 }), null);
});

test("safeNextPath only allows dashboard paths on this site", () => {
  assert.equal(safeNextPath("/usage"), "/usage");
  assert.equal(safeNextPath("/api-keys/new"), "/api-keys/new");
  assert.equal(safeNextPath("/sessions"), "/sessions");
  assert.equal(safeNextPath("/contact"), "/contact");
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

test("parseProfileBody reads only the two names, last name optional", () => {
  assert.deepEqual(parseProfileBody({ firstName: " Siti ", lastName: "Aisyah  Putri" }), { firstName: "Siti", lastName: "Aisyah Putri" });
  for (const blank of [undefined, null, "", "  "]) {
    assert.deepEqual(parseProfileBody({ firstName: "Budi", lastName: blank }), { firstName: "Budi", lastName: null });
  }
  // Fields other than the names never reach the update (no mass assignment).
  assert.deepEqual(parseProfileBody({ firstName: "Budi", email: "x@y.co", status: "active", id: "1" }), { firstName: "Budi", lastName: null });
  for (const bad of [{}, { firstName: "" }, { firstName: "B1" }, { firstName: "Budi", lastName: "D0e" }, null, ["Budi"]]) {
    assert.equal(parseProfileBody(bad), null, JSON.stringify(bad));
  }
});

test("account deletion needs the typed phrase, then the phrase and an 8-digit code", () => {
  for (const ok of ["hapus akun", "  Hapus Akun ", "HAPUS AKUN"]) assert.equal(parseDeleteRequestBody({ confirm: ok }), true, ok);
  for (const bad of [{}, { confirm: "hapus" }, { confirm: "hapusakun" }, { confirm: "delete" }, { confirm: 1 }, null, ["hapus akun"]]) {
    assert.equal(parseDeleteRequestBody(bad), false, JSON.stringify(bad));
  }
  assert.deepEqual(parseDeleteAccountBody({ confirm: "hapus akun", code: "01234567" }), { code: "01234567" });
  for (const bad of [{ code: "01234567" }, { confirm: "hapus akun" }, { confirm: "hapus akun", code: "1234" },
    { confirm: "hapus akun", code: 12345678 }, { confirm: "salah", code: "01234567" }]) {
    assert.equal(parseDeleteAccountBody(bad), null, JSON.stringify(bad));
  }
});
