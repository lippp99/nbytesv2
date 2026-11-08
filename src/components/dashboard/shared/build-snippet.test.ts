import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSnippet, snippetLangs } from "./build-snippet.ts";

test("every language puts the chosen model and the env key in the request", () => {
  for (const { lang } of snippetLangs) {
    const code = buildSnippet(lang, "claude-sonnet-4.5", "https://api.example.com/v1");
    assert.match(code, /claude-sonnet-4\.5/, lang);
    assert.match(code, /NBYTES_API_KEY/, lang);
    assert.match(code, /api\.example\.com\/v1/, lang);
  }
});

test("no snippet ever contains a literal key", () => {
  for (const { lang } of snippetLangs) assert.doesNotMatch(buildSnippet(lang, "gpt-5", "https://api.example.com/v1"), /nb-live-/, lang);
});
