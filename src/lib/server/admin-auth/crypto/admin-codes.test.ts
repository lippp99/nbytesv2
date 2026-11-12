// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeBackupCode } from "../../../admin-auth/admin-auth-contract.ts";
import { newBackupCodes, randomAdminCode } from "./admin-codes.ts";

test("email code is always 10 digits, leading zeros included", () => {
  const codes = Array.from({ length: 5000 }, randomAdminCode);
  for (const code of codes) assert.match(code, /^\d{10}$/);
  assert.ok(codes.some((code) => code.startsWith("0")), "expected some codes with a leading zero");
  assert.equal(new Set(codes).size, codes.length);
});

test("backup codes: 10 distinct codes in the C7 alphabet", () => {
  const codes = newBackupCodes();
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  for (const code of codes) assert.equal(normalizeBackupCode(code), code);
});
