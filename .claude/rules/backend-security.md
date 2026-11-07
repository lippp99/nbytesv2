# Backend, Data & Security

- Secrets only in env vars, read on the server. Never prefix a secret with `NEXT_PUBLIC_`. Commit a `.env.example` with names only.
- Every route handler: authenticate/authorize first, then validate input (shared `*-contract.ts`), then call `lib/server`.
- Webhooks: verify the provider signature before trusting the payload; make handlers idempotent.
- Money is stored as integer minor units, never floats. Timestamps stored in UTC.
- Stack: PostgreSQL + Drizzle ORM (`pg` driver). Local DB runs in Docker (`docker-compose.yml`, `npm run db:up`); config in `.env` (copy from `.env.example`).
- Schema lives in `src/lib/server/db/schema/` (one file per domain, re-exported from `index.ts`); the client is `src/lib/server/db/client.ts`. Import `db` only from `lib/server`.
- Change schema -> `npm run db:generate` -> review the SQL in `drizzle/` -> `npm run db:migrate`. Never hand-edit `drizzle/`. Applying migrations to any non-local database needs the owner's approval.
- Never run `docker compose down -v` (deletes the data volume) without asking.
- Do not log secrets, tokens, or full personal data. Return generic error messages to clients; details stay in server logs.
- Server-only modules start with `import "server-only"`.
