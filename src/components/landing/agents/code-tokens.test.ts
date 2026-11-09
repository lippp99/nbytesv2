import assert from "node:assert/strict";
import { test } from "node:test";
import { type Lang, tokenize } from "./code-tokens.ts";

const join = (line: string, lang: Lang) => tokenize(line, lang).map(([, t]) => t).join("");

test("tokenize never drops or changes text", () => {
  const lines: [string, Lang][] = [
    ['  "baseURL": "https://api.example.com/v1",', "json"],
    ['[model_providers.nbytes]', "toml"],
    ['wire_api = "responses"', "toml"],
    ["  - name: GPT-5 (nbytes)", "yaml"],
    ["export OPENAI_API_KEY=KEY_ANDA", "sh"],
    ["aider --model openai/gpt-5", "sh"],
    ["", "json"],
  ];
  for (const [line, lang] of lines) assert.equal(join(line, lang), line);
});

test("tokenize colours keys, strings and flags", () => {
  assert.deepEqual(tokenize('"a": "b"', "json").filter(([tone]) => tone), [["key", '"a"'], ["str", '"b"']]);
  assert.deepEqual(tokenize('key = "v"', "toml").filter(([tone]) => tone), [["key", "key"], ["str", '"v"']]);
  assert.deepEqual(tokenize("aider --model x", "sh").filter(([tone]) => tone), [["fn", "aider"], ["key", " --model"]]);
});
