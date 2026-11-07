<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules

Fullstack Next.js app (App Router, TypeScript, Tailwind v4, shadcn/ui, next-themes). Keep this file short; details live in `.claude/rules/`.

## Commands

- `npm run dev` / `npm run build` / `npm run lint`
- `npx tsc --noEmit` — typecheck before finishing any change
- `npx shadcn@latest add <name>` — add UI primitives (never hand-edit `src/components/ui/`)
- `npm run map` — regenerate `PROJECT_MAP.md` after structure changes (grep it, do not read it whole)
- `npm run db:up` / `db:down` — local Postgres (Docker); `db:generate` -> `db:migrate` (Drizzle); `db:studio`

## Rules index

- File/folder shape, size limits, dependency direction: `.claude/rules/architecture.md`
- Backend, data, secrets, security: `.claude/rules/backend-security.md`
- Which skill / plugin / MCP to use for which task: `.claude/rules/tooling.md`

## Hard rules

- No secrets in code or client bundles. Read them from env on the server only; keep `.env*` out of git.
- Validate every external input (request bodies, query, webhooks) at the server boundary.
- Do not run destructive DB commands or apply migrations without the owner's approval.
- Server Components by default; add `"use client"` only on interactive leaves.
- Read `node_modules/next/dist/docs/` before using Next.js APIs you are unsure about.
- Names of files, folders, routes and identifiers are English, `kebab-case` for files.
- When a rule changes, update this file or the matching `.claude/rules/` file in the same change.
