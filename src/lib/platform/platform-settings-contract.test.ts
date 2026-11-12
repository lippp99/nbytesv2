import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PLATFORM_SETTINGS as D, parseSettingsBody, settingsErrors } from "./platform-settings-contract.ts";

test("defaults are what the code used before the page existed and are valid", () => {
  assert.deepEqual(D, { signupOpen: true, maintenance: false, banner: "", keyRpm: 120, adminSessionHours: 8 });
  assert.deepEqual(parseSettingsBody(D), D);
});

test("maintenance needs a banner; the banner is trimmed and at most 140 characters", () => {
  assert.deepEqual(settingsErrors({ ...D, maintenance: true, banner: "  " }), { banner: "bannerRequired" });
  assert.deepEqual(settingsErrors({ ...D, banner: "x".repeat(141) }), { banner: "bannerTooLong" });
  assert.equal(parseSettingsBody({ ...D, maintenance: true, banner: " Pemeliharaan 02:00 UTC " })?.banner, "Pemeliharaan 02:00 UTC");
});

test("rate limit is a whole number 1..10000; session hours only 4, 8 or 12", () => {
  for (const keyRpm of [0, 10_001, 1.5, Number.NaN]) assert.equal(parseSettingsBody({ ...D, keyRpm }), null, String(keyRpm));
  assert.equal(parseSettingsBody({ ...D, keyRpm: 1 })?.keyRpm, 1);
  for (const adminSessionHours of [6, "8", null]) assert.equal(parseSettingsBody({ ...D, adminSessionHours }), null);
  assert.equal(parseSettingsBody({ ...D, adminSessionHours: 12 })?.adminSessionHours, 12);
});

test("every field must be present with its type", () => {
  assert.equal(parseSettingsBody({ ...D, signupOpen: "yes" }), null);
  assert.equal(parseSettingsBody({ ...D, banner: undefined }), null);
  assert.equal(parseSettingsBody(null), null);
});
