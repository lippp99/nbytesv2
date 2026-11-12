import "server-only";
import type { EmailKind } from "./otp-rules";

// Auth emails (PRD backend-auth-user §4.2, §12.1): text + simple HTML, no links, buttons or images, code never in the
// subject or the inbox preview. Web fonts load in Apple Mail only (Gmail and Outlook.com drop them), so each stack
// ends in a deliberate fallback; colors are inline because many clients ignore <style>.

export type AuthEmail = { subject: string; text: string; html: string };
/** User emails plus the admin ones (PRD backend-auth-admin §16a): admin code, and the C3 lock notice to the Owner. */
export type MailKind = EmailKind | "admin_login" | "admin_locked";

type Copy = { subject: string; heading: string; intro: string };

const COPY: Record<MailKind, Copy> = {
  login: {
    subject: "Kode login nbytes",
    heading: "Kode login Anda",
    intro: "Masukkan kode ini di halaman login nbytes untuk melanjutkan.",
  },
  signup: {
    subject: "Kode untuk membuat akun nbytes",
    heading: "Kode untuk membuat akun",
    intro: "Masukkan kode ini di halaman daftar nbytes. Akun Anda langsung aktif setelah kode diterima.",
  },
  delete_account: {
    subject: "Kode untuk menghapus akun nbytes",
    heading: "Kode hapus akun",
    intro: "Masukkan kode ini di Account Settings untuk menghapus akun nbytes Anda secara permanen.",
  },
  // The PRD does not fix the subject of the two no-code mails; "nbytes" is a placeholder.
  signup_closed: {
    subject: "nbytes",
    heading: "Pendaftaran sedang ditutup",
    intro: "Pendaftaran akun baru sedang ditutup, jadi tidak ada kode yang dibuat untuk email ini.",
  },
  no_account: {
    subject: "nbytes",
    heading: "Belum ada akun untuk email ini",
    intro: "Tidak ada akun nbytes dengan email ini, jadi tidak ada kode yang dibuat. Buat akun lewat tab Daftar di halaman login.",
  },
  suspended: {
    subject: "nbytes",
    heading: "Akun Anda ditangguhkan",
    intro: "Akun Anda sedang ditangguhkan, jadi tidak ada kode yang dibuat. Hubungi support untuk informasi lebih lanjut.",
  },
  admin_login: {
    subject: "Kode masuk konsol admin nbytes",
    heading: "Kode masuk admin",
    intro: "Masukkan kode ini di halaman masuk admin nbytes, lalu kode dari aplikasi authenticator Anda.",
  },
  // The PRD does not fix this text; the audit log has the details.
  admin_locked: {
    subject: "Login admin nbytes dikunci",
    heading: "Login admin dikunci 1 jam",
    intro: "Ada 10 kode authenticator atau kode cadangan yang salah dalam satu jam, jadi login konsol admin dikunci selama 1 jam.",
  },
};

const VALIDITY = "Berlaku 10 menit.";
const SAFETY = "Abaikan email ini jika Anda tidak meminta kode. Jangan bagikan kode ini kepada siapa pun.";
const IGNORE = "Abaikan email ini jika Anda tidak memintanya.";
const OWNERS_NOTE = "Email ini dikirim ke Owner konsol admin nbytes.";

/** "44348940" -> "4434-8940", "1234567890" -> "12345-67890": the halves of the code input (pasting it back works). */
export const formatCode = (code: string) => `${code.slice(0, code.length / 2)}-${code.slice(code.length / 2)}`;

export function authEmailContent(kind: MailKind, code?: string): AuthEmail {
  const copy = COPY[kind];
  const shown = code ? formatCode(code) : null;
  const footer = shown ? SAFETY : kind === "admin_locked" ? OWNERS_NOTE : IGNORE;
  const text = shown
    ? `${copy.heading}:\n\n${shown}\n\n${VALIDITY} ${copy.intro}\n\n${footer}`
    : `${copy.heading}\n\n${copy.intro}\n\n${footer}`;
  return { subject: copy.subject, text, html: renderHtml(copy, shown, footer) };
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SANS = "'Funnel Sans','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
const DISPLAY = "'Funnel Display','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";
const MONO = "'Fragment Mono','SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
const INK = "#16181a"; // --brand-text
const BRAND = "#c2410c"; // --brand, the "NB" of the logo
const MUTED = "#57534e"; // 7.6:1 on white
const SUBTLE = "#78716c"; // 4.8:1 on white
const LINE = "#e7e5e4";
const WELL = "#fafaf9";
// Pushes the body out of the inbox preview, so only the preheader shows there (never the code).
const PREVIEW_PAD = "&#847;&zwnj;&nbsp;".repeat(60);

const FONTS =
  "https://fonts.googleapis.com/css2?family=Fragment+Mono&family=Funnel+Display:wght@600;800" +
  "&family=Funnel+Sans:wght@400&display=swap";

// Dark mode for clients that support it (Apple Mail): the card brings its own dark surface, so light text never
// lands on a white card. The page itself keeps no background. The rest keep the light card or invert it themselves.
const DARK_CSS =
  "@media (prefers-color-scheme: dark){" +
  ".nb-card{background:#1c1a19!important;border-color:#3a3734!important}.nb-ink{color:#f5f5f4!important}.nb-muted{color:#d6d3d1!important}" +
  ".nb-subtle{color:#a8a29e!important}.nb-well{background:#262422!important;border-color:#3a3734!important}" +
  ".nb-brand{color:#ff8a4c!important}.nb-rule{border-color:#3a3734!important}}" +
  "@media (max-width:520px){.nb-pad{padding:28px 22px!important}.nb-code{font-size:28px!important}}";

function codeBlock(code: string): string {
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 10px">` +
    `<tr><td class="nb-well" align="center" style="background:${WELL};border:1px solid ${LINE};border-radius:12px;` +
    `padding:18px 12px"><span class="nb-ink nb-code" style="font-family:${MONO};font-size:32px;line-height:1.2;` +
    `letter-spacing:0.08em;color:${INK}">${escapeHtml(code)}</span></td></tr></table>` +
    `<p class="nb-subtle" style="margin:0;font-family:${SANS};font-size:13px;line-height:1.5;color:${SUBTLE}">` +
    `${VALIDITY}</p>`
  );
}

function renderHtml(copy: Copy, code: string | null, footer: string): string {
  const preheader = code ? `${VALIDITY} Jangan bagikan kode ini kepada siapa pun.` : copy.heading;
  return (
    `<!doctype html><html lang="id"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">` +
    `<title>${escapeHtml(copy.subject)}</title><link href="${FONTS}" rel="stylesheet">` +
    `<!--[if mso]><style>*{font-family:'Segoe UI',Arial,sans-serif!important}</style><![endif]-->` +
    `<style>${DARK_CSS}</style></head><body style="margin:0;padding:0">` +
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}${PREVIEW_PAD}</div>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">` +
    `<table role="presentation" class="nb-card" width="100%" cellpadding="0" cellspacing="0" ` +
    `style="max-width:480px;background:#ffffff;border:1px solid ${LINE};border-radius:16px"><tr><td class="nb-pad" style="padding:36px 32px">` +
    `<p style="margin:0 0 28px;font-family:${DISPLAY};font-size:20px;font-weight:800;letter-spacing:-0.02em;line-height:1">` +
    `<span class="nb-brand" style="color:${BRAND}">NB</span><span class="nb-ink" style="color:${INK}">ytes</span></p>` +
    `<h1 class="nb-ink" style="margin:0 0 8px;font-family:${DISPLAY};font-size:22px;font-weight:600;line-height:1.3;` +
    `color:${INK}">${escapeHtml(copy.heading)}</h1>` +
    `<p class="nb-muted" style="margin:0;font-family:${SANS};font-size:15px;line-height:1.6;color:${MUTED}">` +
    `${escapeHtml(copy.intro)}</p>` +
    (code ? codeBlock(code) : "") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr>` +
    `<td class="nb-rule" style="border-top:1px solid ${LINE};padding-top:20px">` +
    `<p class="nb-subtle" style="margin:0;font-family:${SANS};font-size:13px;line-height:1.55;color:${SUBTLE}">` +
    `${escapeHtml(footer)}</p></td></tr></table>` +
    `</td></tr></table></td></tr></table></body></html>`
  );
}
