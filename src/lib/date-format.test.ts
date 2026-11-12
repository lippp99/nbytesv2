import assert from "node:assert/strict";
import { test } from "node:test";
import { formatWib } from "./date-format.ts";

test("formatWib shifts UTC to WIB and rolls over the day", () => {
  assert.equal(formatWib("2026-11-10T07:20:00.000Z"), "10 Nov, 14.20 WIB");
  assert.equal(formatWib("2026-12-31T18:05:00.000Z"), "1 Jan, 01.05 WIB");
});
