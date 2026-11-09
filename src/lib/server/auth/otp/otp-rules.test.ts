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

test("decideEmail: per tab, known email always gets a login code, login tab never creates", () => {
  assert.equal(decideEmail(undefined, true, "register"), "signup");
  assert.equal(decideEmail(undefined, false, "register"), "signup_closed");
  assert.equal(decideEmail(undefined, true, "login"), "no_account");
  for (const mode of ["login", "register"] as const) {
    assert.equal(decideEmail("active", true, mode), "login");
    assert.equal(decideEmail("active", false, mode), "login");
    assert.equal(decideEmail("suspended", true, mode), "suspended");
  }
  assert.deepEqual(
    (["signup", "login", "signup_closed", "suspended", "no_account"] as const).filter(emailGetsCode),
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

test("decideLogin: only the register tab creates accounts", () => {
  assert.equal(decideLogin("active", false, "login"), "login");
  assert.equal(decideLogin("active", true, "register"), "login");
  assert.equal(decideLogin(undefined, true, "register"), "create");
  assert.equal(decideLogin(undefined, false, "register"), "blocked_signup_closed");
  assert.equal(decideLogin(undefined, true, "login"), "blocked_no_account");
  assert.equal(decideLogin("suspended", true, "register"), "blocked_suspended");
});
