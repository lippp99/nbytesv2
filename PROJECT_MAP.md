# PROJECT_MAP

Dibuat otomatis oleh `npm run map` (`scripts/generate-map.mjs`). Jangan diedit manual.
Sumber: `git ls-files`, jadi berkas yang di-ignore git tidak tercantum (`node_modules`, `.next`, `.claude/worktrees`, dll.).
Dikecualikan juga: `.impeccable/`, `.env*` selain `.env.example`, dan berkas ini.

Total: 32 berkas, 12 folder.

## Skrip

- `npm run dev`: `next dev`
- `npm run build`: `next build`
- `npm run start`: `next start`
- `npm run lint`: `eslint`
- `npm run map`: `node scripts/generate-map.mjs`
- `npm run db:up`: `docker compose up -d db`
- `npm run db:down`: `docker compose down`
- `npm run db:generate`: `drizzle-kit generate`
- `npm run db:migrate`: `drizzle-kit migrate`
- `npm run db:studio`: `drizzle-kit studio`

## Rute

| URL | Jenis | Method | Berkas |
|---|---|---|---|
| `/` | halaman | - | `src/app/page.tsx` |
| `/favicon.ico` | metadata | - | `src/app/favicon.ico` |

## Berkas

```
.claude/rules/architecture.md  (85 baris)
.claude/rules/backend-security.md  (12 baris)
.claude/rules/tooling.md  (59 baris)
.env.example  (0.2 KB)
.gitignore  (0.5 KB)
AGENTS.md  (37 baris)
CLAUDE.md  (1 baris)
README.md  (36 baris)
components.json  (25 baris)
docker-compose.yml  (0.5 KB)
drizzle.config.ts  (15 baris · export: default)
eslint.config.mjs  (18 baris · export: default)
next.config.ts  (17 baris · export: default)
package-lock.json  (364.1 KB)
package.json  (44 baris)
prompt.md  (18 baris)
public/file.svg  (0.4 KB)
public/globe.svg  (1.0 KB)
public/next.svg  (1.3 KB)
public/vercel.svg  (0.1 KB)
public/window.svg  (0.4 KB)
scripts/generate-map.mjs  (141 baris)
src/app/favicon.ico  (14.7 KB)
src/app/globals.css  (130 baris)
src/app/layout.tsx  (35 baris · export: metadata, RootLayout)
src/app/page.tsx  (69 baris · export: Home)
src/components/theme-provider.tsx  (8 baris · client · export: ThemeProvider)
src/components/ui/button.tsx  (57 baris · export: Button, buttonVariants)
src/lib/server/db/client.ts  (17 baris · server-only · export: db)
src/lib/server/db/schema/index.ts  (2 baris)
src/lib/utils.ts  (1 baris · export: cn)
tsconfig.json  (34 baris)
```
