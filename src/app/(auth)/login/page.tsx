import type { Metadata } from "next";
import { authCopy } from "@/components/auth/auth-copy";
import { LoginForm } from "@/components/auth/login-form";
import { Wordmark } from "@/components/wordmark";

export const metadata: Metadata = { title: authCopy.pageTitle };

// One centred rounded card on a muted page, after jatevo.ai/app/login (480px card, 20px radius, 34/40px padding).
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12 pt-safe">
      <div className="w-full max-w-120 animate-enter-up rounded-card border border-border bg-background px-6 pt-8 pb-7 sm:px-10">
        <div className="mb-6 flex justify-center">
          <Wordmark />
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
