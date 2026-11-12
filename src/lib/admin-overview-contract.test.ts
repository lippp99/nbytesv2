import assert from "node:assert/strict";
import { test } from "node:test";
import { type AlertFacts, buildAlerts, coverageBp, fillDays, grossMargin } from "./admin-overview-contract.ts";

test("gross margin of known-cost requests, percent in basis points", () => {
  assert.deepEqual(grossMargin(5500, 3750), { micros: 1750, bp: 3182 });
  assert.deepEqual(grossMargin(0, 12), { micros: -12, bp: null });
  assert.deepEqual(grossMargin(100, 150), { micros: -50, bp: -5000 });
});

test("coverage: Surplus credit over users' balance; unknown or nothing owed -> null", () => {
  assert.equal(coverageBp(12_500_000, 10_000_000), 12_500);
  assert.equal(coverageBp(5_000_000, 10_000_000), 5_000);
  assert.equal(coverageBp(null, 10_000_000), null);
  assert.equal(coverageBp(5_000_000, 0), null);
});

const quiet: AlertFacts = {
  surplusUnreadable: false, coverageLow: false, serviceUnavailable24h: 0, negativeMargin24h: 0, costPendingOld: 0,
  depositsStuck: 0, webhookMismatch7d: 0, noExchangeRate: false, adminLocked24h: 0, totpFailed24h: 0, negativeBalances: 0,
};

test("alerts: none when quiet; fixed order, most urgent first", () => {
  assert.deepEqual(buildAlerts(quiet), []);
  const alerts = buildAlerts({ ...quiet, totpFailed24h: 3, noExchangeRate: true, coverageLow: true });
  assert.deepEqual(alerts, [
    { kind: "coverageLow", tone: "danger", count: 1 },
    { kind: "noExchangeRate", tone: "warning", count: 1 },
    { kind: "totpFailed24h", tone: "warning", count: 3 },
  ]);
});

test("30 UTC days, oldest first, zeros where empty", () => {
  const today = new Date("2026-11-12T15:00:00Z");
  const days = fillDays([{ date: "2026-11-12", chargeMicros: 5, costMicros: 3, requests: 2, failed: 1 }], today);
  assert.equal(days.length, 30);
  assert.equal(days[0].date, "2026-10-14");
  assert.deepEqual(days[29], { date: "2026-11-12", chargeMicros: 5, costMicros: 3, requests: 2, failed: 1 });
  assert.deepEqual(days[28], { date: "2026-11-11", chargeMicros: 0, costMicros: 0, requests: 0, failed: 0 });
});
