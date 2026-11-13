import assert from "node:assert/strict";
import { test } from "node:test";
import { leaderboardHref, ranks } from "./leaderboard-contract.ts";

test("competition ranking: ties share a rank, the next rank skips", () => {
  assert.deepEqual(ranks([100, 80, 80, 50]), [1, 2, 2, 4]);
  assert.deepEqual(ranks([5, 5, 5]), [1, 1, 1]);
  assert.deepEqual(ranks([9, 8, 7]), [1, 2, 3]);
  assert.deepEqual(ranks([]), []);
});

test("href carries the period like the Usage page; this month is the bare URL", () => {
  assert.equal(leaderboardHref({ kind: "month", month: "2026-11" }, "2026-11"), "/admin/leaderboard");
  assert.equal(leaderboardHref({ kind: "year", year: "2025" }, "2026-11"), "/admin/leaderboard?period=year&year=2025");
  assert.equal(leaderboardHref({ kind: "range", from: "2026-11-01", to: "2026-11-05" }, "2026-11"),
    "/admin/leaderboard?period=range&from=2026-11-01&to=2026-11-05");
});
