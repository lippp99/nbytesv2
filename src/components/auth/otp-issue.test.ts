import assert from "node:assert/strict";
import { test } from "node:test";
import { otpIssueOf } from "./otp-issue.ts";

test("verify errors map to the state the code step shows", () => {
  assert.deepEqual(otpIssueOf({ kind: "invalid", attemptsLeft: 3 }), { kind: "invalid", attemptsLeft: 3 });
  assert.deepEqual(otpIssueOf({ kind: "expired" }), { kind: "expired" });
  assert.deepEqual(otpIssueOf({ kind: "rate_limited", retryAfterMinutes: 15 }), { kind: "locked", minutes: 15 });
  assert.deepEqual(otpIssueOf({ kind: "offline" }), { kind: "offline" });
  assert.deepEqual(otpIssueOf({ kind: "invalid_input" }), { kind: "incomplete" });
  assert.deepEqual(otpIssueOf({ kind: "unavailable" }), { kind: "check_failed" });
});

test("a server fault on resend is a failed email, not a failed check", () => {
  assert.deepEqual(otpIssueOf({ kind: "unavailable" }, true), { kind: "send_failed", error: { kind: "unavailable" } });
  assert.deepEqual(otpIssueOf({ kind: "rate_limited", retryAfterMinutes: 2 }, true), { kind: "locked", minutes: 2 });
});
