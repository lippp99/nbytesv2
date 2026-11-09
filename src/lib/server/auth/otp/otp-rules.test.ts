// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import { OTP_MAX_ATTEMPTS as CONTRACT_MAX } from "../../../auth/auth-contract.ts";
import { OTP_MAX_ATTEMPTS, decideEmail, decideLogin, emailGetsCode, judgeAttempt } from "./otp-rules.ts";

const now = new Date("2026-11-09T10:00:00Z");
const live = (attempts = 0) => ({ attempts, expiresAt: new Date(now.getTime() + 60_000), consumedAt: null });

test("attempt limit matches the shared contract", () => {
  assert.equal(OTP_MAX_ATTEMPTS, CONTRACT_MAX);
});

test("decideEmail: table §4.2", () => {
  assert.equal(decideEmail(undefined, true), "signup");
  assert.equal(decideEmail("active", true), "login");
  assert.equal(decideEmail("active", false), "login");
  assert.equal(decideEmail(undefined, false), "signup_closed");
  assert.equal(decideEmail("suspended", true), "suspended");
  assert.deepEqual(
    (["signup", "login", "signup_closed", "suspended"] as const).filter(emailGetsCode),
    ["signup", "login"],
  );
});

test("judgeAttempt: correct, wrong, last try, expired, used, missing", () => {
  assert.deepEqual(judgeAttempt(live(), true, now), { kind: "ok" });
  assert.deepEqual(judgeAttempt(live(0), false, now), { kind: "invalid", attemptsLeft: 4 });
  assert.deepEqual(judgeAttempt(live(3), false, now), { kind: "invalid", attemptsLeft: 1 });
  assert.deepEqual(judgeAttempt(live(4), false, now), { kind: "invalid", attemptsLeft: 0 }, "5th miss is still counted");
  assert.deepEqual(judgeAttempt(live(5), true, now), { kind: "expired" }, "right code after 5 misses is refused");
  assert.deepEqual(judgeAttempt({ ...live(), expiresAt: now }, true, now), { kind: "expired" });
  assert.deepEqual(judgeAttempt({ ...live(), consumedAt: now }, true, now), { kind: "expired" });
  assert.deepEqual(judgeAttempt(undefined, true, now), { kind: "expired" });
});

test("decideLogin: table §4.3", () => {
  assert.equal(decideLogin("active", false), "login");
  assert.equal(decideLogin(undefined, true), "create");
  assert.equal(decideLogin(undefined, false), "blocked_signup_closed");
  assert.equal(decideLogin("suspended", true), "blocked_suspended");
});
