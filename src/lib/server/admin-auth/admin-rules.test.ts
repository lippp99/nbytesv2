// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SESSION_IDLE_MS, TOTP_MAX_ATTEMPTS, attemptsLeftAfterMiss, canSignIn, sessionAlive, ticketUsable,
} from "./admin-rules.ts";

const now = new Date("2026-11-11T10:00:00Z");
const later = new Date(now.getTime() + 60_000);
const earlier = new Date(now.getTime() - 60_000);

test("canSignIn: active, live invite; not an expired invite, locked or unknown (§16a)", () => {
  const base = { inviteExpiresAt: null, lockedUntil: null };
  assert.equal(canSignIn({ ...base, status: "active" }, now), true);
  assert.equal(canSignIn({ ...base, status: "invited", inviteExpiresAt: later }, now), true);
  assert.equal(canSignIn({ ...base, status: "invited", inviteExpiresAt: earlier }, now), false);
  assert.equal(canSignIn({ ...base, status: "invited" }, now), false);
  assert.equal(canSignIn({ ...base, status: "active", lockedUntil: later }, now), false);
  assert.equal(canSignIn({ ...base, status: "active", lockedUntil: earlier }, now), true, "lock ran out");
  assert.equal(canSignIn(undefined, now), false);
});

test("ticket: 5 TOTP attempts, then spent; expired tickets refused", () => {
  assert.equal(ticketUsable({ totpAttempts: 0, expiresAt: later }, now), true);
  assert.equal(ticketUsable({ totpAttempts: TOTP_MAX_ATTEMPTS - 1, expiresAt: later }, now), true);
  assert.equal(ticketUsable({ totpAttempts: TOTP_MAX_ATTEMPTS, expiresAt: later }, now), false);
  assert.equal(ticketUsable({ totpAttempts: 0, expiresAt: now }, now), false);
  assert.equal(ticketUsable(undefined, now), false);
  assert.equal(attemptsLeftAfterMiss(0), 4);
  assert.equal(attemptsLeftAfterMiss(4), 0);
});

test("session: absolute, idle, status and TOTP state (§8)", () => {
  const t = now.getTime();
  const ok = { expiresAt: later, lastSeenAt: now, status: "active" as const, totpEnabled: true };
  assert.equal(sessionAlive(ok, t), true);
  assert.equal(sessionAlive({ ...ok, expiresAt: now }, t), false);
  assert.equal(sessionAlive({ ...ok, lastSeenAt: new Date(t - SESSION_IDLE_MS) }, t), false);
  assert.equal(sessionAlive({ ...ok, status: "invited" }, t), false);
  assert.equal(sessionAlive({ ...ok, totpEnabled: false }, t), false);
});
