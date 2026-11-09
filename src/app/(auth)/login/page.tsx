import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authCopy } from "@/components/auth/auth-copy";
import { LoginForm } from "@/components/auth/login-form";
import { Wordmark } from "@/components/wordmark";
import { DEFAULT_AFTER_LOGIN, safeNextPath } from "@/lib/auth/auth-contract";
import { readSession } from "@/lib/server/auth/session";

export const metadata: Metadata = { title: authCopy.pageTitle };
// Reads ?next on every request, so the page renders at request time (blocking route, no static shell).
export const instant = false;

/** Already signed in (checked in the database, not just the cookie) -> straight to the dashboard. Renders nothing. */
async function RedirectIfSignedIn({ next }: { next: string | null }) {
  if (await readSession()) redirect(safeNextPath(next) ?? DEFAULT_AFTER_LOGIN);
  return null;
}

// One centred rounded card on a muted page, after jatevo.ai/app/login (480px card, 20px radius, 34/40px padding).
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // One form for login and sign-up, so ?mode=register from old links is simply ignored.
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? next : null;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12 pt-safe">
      <Suspense fallback={null}>
        <RedirectIfSignedIn next={nextPath} />
      </Suspense>
      <div className="w-full max-w-120 animate-enter-up rounded-card border border-border bg-background px-6 pt-8 pb-7 sm:px-10">
        <div className="mb-6 flex justify-center">
          <Wordmark />
        </div>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
