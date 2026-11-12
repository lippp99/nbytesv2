import assert from "node:assert/strict";
import { test } from "node:test";
import { activeItem, groupIndexOf, isActive } from "./nav-items.ts";

test("an item matches its page and sub-pages, not look-alike prefixes", () => {
  assert.equal(isActive("/api-keys", "/api-keys"), true);
  assert.equal(isActive("/api-keys/key_1", "/api-keys"), true);
  assert.equal(isActive("/api-keys-old", "/api-keys"), false);
  assert.equal(isActive("/usage", "/api-keys"), false);
});

test("activeItem finds the menu entry for the header breadcrumb", () => {
  assert.equal(activeItem("/playground")?.label, "Playground");
  assert.equal(activeItem("/settings")?.label, "Account Settings");
  assert.equal(activeItem("/sessions")?.label, "Active Sessions");
  assert.equal(activeItem("/contact")?.label, "Kontak admin");
  assert.equal(activeItem("/unknown"), undefined);
});

test("groupIndexOf opens the rail on the group of the current page", () => {
  assert.equal(groupIndexOf("/quick-start"), 0);
  assert.equal(groupIndexOf("/api-keys/key_1"), 1);
  assert.equal(groupIndexOf("/settings"), 2);
  assert.equal(groupIndexOf("/sessions"), 2);
  assert.equal(groupIndexOf("/contact"), 2);
  assert.equal(groupIndexOf("/unknown"), 0);
});
