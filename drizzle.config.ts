import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load env files itself (Next.js does for the app); same file Next and docker compose use.
try {
  process.loadEnvFile(".env.local");
} catch {}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (copy .env.example to .env.local)");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL },
});
