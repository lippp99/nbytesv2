import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authCopy } from "@/components/auth/auth-copy";
import { LoginForm } from "@/components/auth/login-form";
import { Wordmark } from "@/components/wordmark";
import { DEFAULT_AFTER_LOGIN, parseModeParam, safeNextPath } from "@/lib/auth/auth-contract";
import { readSession } from "@/lib/server/auth/session";

export const metadata: Metadata = { title: authCopy.pageTitle };
// Reads ?next on every request, so the page renders at request time (blocking route, no static shell).
export const instant = false;

/** Already signed in (checked in the database, not just the cookie) -> straight to the dashboard. Renders nothing. */
async function RedirectIfSignedIn({ next }: { next: string | null }) {
  if (await readSession()) redirect(safeNextPath(next) ?? DEFAULT_AFTER_LOGIN);
  return null;
}

// One card (max 480px, 20px radius) on a grey page; in dark mode the page stays darker than the card.
// Phones: card top-aligned so switching tabs does not move the logo and tabs, 20px inner padding (320px phone -> 246px
// content, OTP slots ~26px). From 640px: centred, 40px padding.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // ?mode=register (landing "Register" link) opens the register tab.
  const { next, mode } = await searchParams;
  const nextPath = typeof next === "string" ? next : null;
  return (
    <main className="flex min-h-dvh items-start justify-center bg-secondary px-4 pt-safe sm:items-center dark:bg-background">
      <Suspense fallback={null}>
        <RedirectIfSignedIn next={nextPath} />
      </Suspense>
      {/* own wrapper for the vertical padding: pt-safe on <main> would override a py-* there */}
      <div className="w-full max-w-120 py-10 sm:py-12">
        <div className="animate-enter-up rounded-card border border-border bg-card px-5 pt-8 pb-7 shadow-sm sm:px-10">
          <div className="mb-6 flex justify-center">
            <Wordmark />
          </div>
          <LoginForm nextPath={nextPath} initialMode={parseModeParam(mode)} />
        </div>
      </div>
    </main>
  );
}
