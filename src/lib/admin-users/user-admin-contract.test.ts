import assert from "node:assert/strict";
import { test } from "node:test";
import { parseUserFilter, parseUserSearch, parseUserStatusBody } from "./user-admin-contract.ts";

test("filter and search from the URL", () => {
  assert.equal(parseUserFilter("suspended"), "suspended");
  assert.equal(parseUserFilter("pending"), "all"); // no such status in the database
  assert.equal(parseUserFilter(undefined), "all");
  assert.equal(parseUserSearch("  rina "), "rina");
  assert.equal(parseUserSearch("   "), null);
  assert.equal(parseUserSearch(["a"]), null);
  assert.equal(parseUserSearch("x".repeat(150))?.length, 100);
});

test("suspending needs a reason up to 200 characters; restoring does not", () => {
  assert.deepEqual(parseUserStatusBody({ status: "suspended", reason: " spam " }), { status: "suspended", reason: "spam" });
  assert.deepEqual(parseUserStatusBody({ status: "active" }), { status: "active", reason: null });
  assert.equal(parseUserStatusBody({ status: "suspended" }), null);
  assert.equal(parseUserStatusBody({ status: "suspended", reason: "   " }), null);
  assert.equal(parseUserStatusBody({ status: "suspended", reason: "x".repeat(201) }), null);
  assert.ok(parseUserStatusBody({ status: "suspended", reason: "x".repeat(200) }));
  for (const body of [{ status: "pending", reason: "x" }, { status: "deleted" }, null, []]) {
    assert.equal(parseUserStatusBody(body), null, JSON.stringify(body));
  }
});
