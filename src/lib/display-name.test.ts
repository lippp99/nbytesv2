import assert from "node:assert/strict";
import { test } from "node:test";
import { displayName, initialsOf } from "./display-name.ts";

const person = (firstName: string | null, lastName: string | null) => ({ email: "andi@x.co", firstName, lastName });

test("displayName joins the names, or falls back to the email", () => {
  assert.equal(displayName(person("Siti", "Aisyah")), "Siti Aisyah");
  assert.equal(displayName(person("Budi", null)), "Budi");
  assert.equal(displayName(person(null, null)), "andi@x.co");
});

test("initialsOf takes first letters, uppercase, at most two", () => {
  assert.equal(initialsOf(person("siti", "aisyah putri")), "SA");
  assert.equal(initialsOf(person("Budi", null)), "B");
  assert.equal(initialsOf(person(null, null)), "A");
  assert.equal(initialsOf(person("Ölaf", "Ñ")), "ÖÑ");
});
