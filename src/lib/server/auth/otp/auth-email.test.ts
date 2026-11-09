// Run with: node --conditions=react-server --test (resolves "server-only" to its empty build).
import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeOtp } from "../../../auth/auth-contract.ts";
import { authEmailContent, formatCode } from "./auth-email.ts";

test("formatCode groups 8 digits 4-4 with a hyphen, and pasting it back gives the code", () => {
  assert.equal(formatCode("44348940"), "4434-8940");
  assert.equal(formatCode("00012345"), "0001-2345");
  assert.equal(sanitizeOtp(formatCode("44348940")), "44348940");
});

test("code mails show the code in text and html, never in the subject or the preview", () => {
  for (const kind of ["login", "signup"] as const) {
    const mail = authEmailContent(kind, "44348940");
    assert.match(mail.text, /4434-8940/);
    assert.match(mail.html, /4434-8940/);
    assert.doesNotMatch(mail.subject, /\d/);
    const preview = mail.html.match(/<div style="display:none[^>]*>([^<]*)<\/div>/)?.[1] ?? "";
    assert.ok(preview.length > 0, "preheader present");
    assert.doesNotMatch(preview, /\d{4}/);
  }
});

test("no links, buttons, images or scripts (PRD §12.1)", () => {
  for (const kind of ["login", "signup", "signup_closed", "suspended", "no_account"] as const) {
    const { html, text } = authEmailContent(kind, kind === "login" || kind === "signup" ? "12345678" : undefined);
    assert.doesNotMatch(html, /<a\s|<img|<button|<script|<form/i);
    assert.doesNotMatch(text, /https?:\/\//);
  }
});

test("no-code mails explain, without a code block", () => {
  const mail = authEmailContent("suspended");
  assert.match(mail.text, /ditangguhkan/);
  assert.doesNotMatch(mail.html, /class="nb-well"/);
  assert.match(authEmailContent("signup_closed").text, /ditutup/);
  assert.match(authEmailContent("no_account").text, /Daftar/);
});
