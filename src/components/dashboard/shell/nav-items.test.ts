import assert from "node:assert/strict";
import { test } from "node:test";
import { activeItem, isActive } from "./nav-items.ts";

test("an item matches its page and sub-pages, not look-alike prefixes", () => {
  assert.equal(isActive("/api-keys", "/api-keys"), true);
  assert.equal(isActive("/api-keys/key_1", "/api-keys"), true);
  assert.equal(isActive("/api-keys-old", "/api-keys"), false);
  assert.equal(isActive("/usage", "/api-keys"), false);
});

test("activeItem finds the menu entry for the header breadcrumb", () => {
  assert.equal(activeItem("/playground")?.label, "Playground");
  assert.equal(activeItem("/settings")?.label, "Account Settings");
  assert.equal(activeItem("/unknown"), undefined);
});
