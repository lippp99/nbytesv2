// Membuat PROJECT_MAP.md: daftar berkas proyek menurut git (path lengkap per baris agar hasil grep
// langsung menunjukkan lokasi) beserta tabel rute dan ekspor tiap modul. Jalankan lewat `npm run map`.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "PROJECT_MAP.md";
const NO_COUNT = new Set(["package-lock.json"]);
const CODE = /\.(tsx?|jsx?|mjs|cjs)$/;
const TEXT = /\.(tsx?|jsx?|mjs|cjs|css|json|md|mdx)$/;
const EXPORT = /^export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|type|interface|enum)\s+(\w+)/gm;
const HTTP_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]);
const METADATA = /^(favicon|icon|apple-icon|opengraph-image|twitter-image|sitemap|robots|manifest)\d*\.\w+$/;
const GENERATED_METADATA = { sitemap: "sitemap.xml", robots: "robots.txt", manifest: "manifest.webmanifest" };

const skipFile = (path) => {
  const name = path.split("/").pop();
  return path === OUT || path.startsWith(".impeccable/") || (name.startsWith(".env") && name !== ".env.example");
};

// Sumber daftar berkas: git, jadi .gitignore dan .git/info/exclude (mis. .claude/worktrees/) ikut berlaku.
function listFiles() {
  const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  const paths = new Set(out.split("\0").filter(Boolean));
  return [...paths].filter((p) => !skipFile(p) && existsSync(join(ROOT, p))).sort();
}

// shortcut: regex, bukan parser, cukup untuk bentuk ekspor yang ada; pakai parser TypeScript bila ada bentuk yang terlewat.
function exportNames(src) {
  const names = [...src.matchAll(EXPORT)].map((m) => m[1]);
  for (const m of src.matchAll(/^export\s+(?:type\s+)?\{([^}]+)\}/gm)) {
    names.push(...m[1].split(",").map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()).filter(Boolean));
  }
  if (/^export default\s+(?!(?:async\s+)?(?:function|class)\s+\w)/m.test(src)) names.push("default");
  return [...new Set(names)];
}

function inspect(path) {
  const name = path.split("/").pop();
  const full = join(ROOT, path);
  if (!TEXT.test(name) || NO_COUNT.has(name)) return { meta: `${(statSync(full).size / 1024).toFixed(1)} KB`, exports: [] };
  const src = readFileSync(full, "utf8");
  const lines = src === "" ? 0 : src.split("\n").length - (src.endsWith("\n") ? 1 : 0);
  const parts = [`${lines} baris`];
  const exports = CODE.test(name) ? exportNames(src) : [];
  if (CODE.test(name)) {
    if (/^["']use client["']/m.test(src.slice(0, 200))) parts.push("client");
    if (/import ["']server-only["']/.test(src)) parts.push("server-only");
    if (exports.length) parts.push(`export: ${exports.join(", ")}`);
  }
  return { meta: parts.join(" · "), exports };
}

function routeFor(path, exports) {
  const rel = path.replace(/^src\//, "");
  if (!rel.startsWith("app/")) return null;
  const segs = rel.split("/").slice(1);
  const name = segs.pop();
  if (segs.some((s) => s.startsWith("_"))) return null; // folder privat tidak punya URL
  const dir = segs.filter((s) => !/^\(.*\)$/.test(s) && !s.startsWith("@")).map((s) => `/${s}`).join("");
  if (/^page\.(tsx?|jsx?)$/.test(name)) return { url: dir || "/", kind: "halaman", methods: "-", file: path };
  if (/^route\.(tsx?|jsx?)$/.test(name)) {
    const methods = exports.filter((e) => HTTP_METHODS.has(e)).join(", ") || "-";
    return { url: dir || "/", kind: "API", methods, file: path };
  }
  if (!METADATA.test(name)) return null;
  const stem = name.split(".")[0];
  const served = CODE.test(name) ? GENERATED_METADATA[stem] ?? stem : name;
  return { url: `${dir}/${served}`, kind: "metadata", methods: "-", file: path };
}

// Pemeriksaan diri bagian yang rawan salah, berjalan setiap kali skrip dipakai.
assert.deepEqual(
  exportNames('export type { A, B as C };\nexport { type D, E };\nexport const F = 1;\nexport default foo;\n'),
  ["F", "A", "C", "D", "E", "default"],
);
assert.deepEqual(exportNames("export default function Page() {}\n"), ["Page"]);
assert.deepEqual(exportNames("export default async function () {}\n"), ["default"]);
assert.equal(routeFor("app/admin/(panel)/page.tsx", []).url, "/admin");
assert.equal(routeFor("app/page.tsx", []).url, "/");
assert.equal(routeFor("src/app/api/x/route.ts", ["POST"]).url, "/api/x");
assert.equal(routeFor("app/api/x/route.ts", ["GET", "helper"]).methods, "GET");
assert.equal(routeFor("app/_lib/page.tsx", []), null);
assert.equal(routeFor("app/icon.png", []).url, "/icon.png");
assert.equal(routeFor("app/sitemap.ts", []).url, "/sitemap.xml");
assert.equal(routeFor("app/layout.tsx", []), null);

const routes = [];
const dirs = new Set();
const paths = listFiles();
const fileRows = paths.map((path) => {
  const { meta, exports } = inspect(path);
  const route = routeFor(path, exports);
  if (route) routes.push(route);
  const segs = path.split("/");
  for (let i = 1; i < segs.length; i++) dirs.add(segs.slice(0, i).join("/"));
  return `${path}  (${meta})`;
});

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const scripts = Object.entries(pkg.scripts ?? {}).map(([k, v]) => `- \`npm run ${k}\`: \`${v}\``);
const routeRows = routes
  .sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0))
  .map((r) => `| \`${r.url}\` | ${r.kind} | ${r.methods} | \`${r.file}\` |`);

const out = [
  "# PROJECT_MAP",
  "",
  "Dibuat otomatis oleh `npm run map` (`scripts/generate-map.mjs`). Jangan diedit manual.",
  "Sumber: `git ls-files`, jadi berkas yang di-ignore git tidak tercantum (`node_modules`, `.next`, `.claude/worktrees`, dll.).",
  "Dikecualikan juga: `.impeccable/`, `.env*` selain `.env.example`, dan berkas ini.",
  "",
  `Total: ${paths.length} berkas, ${dirs.size} folder.`,
  "",
  "## Skrip",
  "",
  ...scripts,
  "",
  "## Rute",
  "",
  "| URL | Jenis | Method | Berkas |",
  "|---|---|---|---|",
  ...routeRows,
  "",
  "## Berkas",
  "",
  "```",
  ...fileRows,
  "```",
  "",
].join("\n");

writeFileSync(join(ROOT, OUT), out);
console.log(`${OUT}: ${paths.length} berkas, ${routes.length} rute`);
