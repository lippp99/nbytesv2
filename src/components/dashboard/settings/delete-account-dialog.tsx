"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dangerAction, ghostAction, secondaryAction } from "@/components/app-kit/button";
import { Field, TextInput, describedBy } from "@/components/app-kit/field";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type DeleteAccountError, deleteAccount, requestDeleteCode } from "@/lib/auth/auth-client";
import { isDeleteConfirmed, isValidOtp, maskEmail, sanitizeOtp } from "@/lib/auth/auth-contract";
import { settings, errorText } from "./settings-copy";

const copy = settings.deleteDialog;
type Step = "phrase" | "code";

// ui/alert-dialog merges with the bare `cn`, so these overrides need `!`. Phone: full width minus 16px a side, pinned
// 16px from the top so the keyboard never covers the field. From 640px: centered, at most 448px. Scrolls if too tall.
const popup =
  "w-[calc(100%-2rem)]! max-w-md! gap-0! overflow-y-auto rounded-app-card! bg-app-raised! p-0! text-app-text! " +
  "shadow-app-raised ring-app-border! max-h-[calc(100dvh-2rem)] max-sm:top-4! max-sm:translate-y-0! motion-reduce:animate-none!";

/** Account deletion in one alertdialog: type the phrase, then the code from the account's email (PRD §12). */
export function DeleteAccountDialog({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("phrase");
  const [phrase, setPhrase] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function changeOpen(next: boolean) {
    if (pending) return; // never close mid-request
    setOpen(next);
    if (next) return;
    setStep("phrase");
    setPhrase("");
    setCode("");
    setError(null);
    setNotice(null);
  }

  function fail(err: DeleteAccountError) {
    if (err.kind === "unauthorized") return router.push("/login?next=%2Fsettings");
    if (err.kind === "blocked") return setError(copy.blocked);
    if (err.kind === "invalid") return setError(copy.codeInvalid(err.attemptsLeft));
    if (err.kind !== "expired") return setError(errorText(err));
    setError(copy.codeExpired);
    setCode("");
    setResendIn(0);
  }

  async function sendCode() {
    setError(null);
    setNotice(null);
    setPending(true);
    const result = await requestDeleteCode(phrase);
    setPending(false);
    if (!result.ok) return fail(result.error);
    setResendIn(result.resendAfter);
    setCode("");
    if (step === "code") setNotice(copy.resent);
    else setStep("code");
  }

  async function confirmDelete() {
    setError(null);
    setNotice(null);
    setPending(true);
    const result = await deleteAccount(phrase, code);
    if (result.ok) return window.location.replace("/"); // full load: no signed-in screen survives in the router cache
    setPending(false);
    fail(result.error);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === "phrase") return isDeleteConfirmed(phrase) ? sendCode() : setError(copy.phraseMismatch);
    return isValidOtp(code) ? confirmDelete() : setError(copy.codeIncomplete);
  }

  const field = step === "phrase" ? (
    <Field id="delete-phrase" label={copy.phraseLabel} error={error}>
      <TextInput id="delete-phrase" value={phrase} autoFocus autoComplete="off" autoCapitalize="none" autoCorrect="off"
        spellCheck={false} disabled={pending} aria-invalid={error ? true : undefined}
        aria-describedby={describedBy("delete-phrase", { error })} onChange={(e) => { setPhrase(e.target.value); setError(null); }} />
    </Field>
  ) : (
    <Field id="delete-code" label={copy.codeLabel} hint={copy.codeHint} error={error}>
      <TextInput id="delete-code" value={code} autoFocus inputMode="numeric" autoComplete="one-time-code" disabled={pending}
        className="font-mono tracking-widest" aria-invalid={error ? true : undefined}
        aria-describedby={describedBy("delete-code", { hint: copy.codeHint, error })}
        onChange={(e) => { setCode(sanitizeOtp(e.target.value)); setError(null); }} />
    </Field>
  );

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger render={<button type="button" className={dangerAction()} />}>{settings.deleteAccount}</AlertDialogTrigger>
      <AlertDialogContent className={popup}>
        <form noValidate onSubmit={submit}>
          <div className="space-y-2 p-6 pb-5">
            <AlertDialogTitle className="text-app-section! text-app-text">{copy.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-app-ui! text-app-text-2!">
              {step === "phrase" ? copy.body : copy.codeBody(maskEmail(email))}
            </AlertDialogDescription>
          </div>
          <div className="px-6 pb-6">
            {field}
            {step === "code" && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <button type="button" onClick={sendCode} disabled={pending || resendIn > 0} className={ghostAction("-ml-3", "sm")}>
                  {resendIn > 0 ? `${copy.resend} (${resendIn})` : copy.resend}
                </button>
                {notice && <p role="status" className="text-app-small text-app-text-2">{notice}</p>}
              </div>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-app-border bg-app-inset px-6 py-4 sm:flex-row sm:justify-end">
            <AlertDialogCancel render={<button type="button" disabled={pending} className={secondaryAction()} />}>
              {copy.cancel}
            </AlertDialogCancel>
            <button type="submit" disabled={pending || (step === "phrase" && !isDeleteConfirmed(phrase))}
              aria-busy={pending || undefined} className={dangerAction()}>
              {step === "phrase" ? (pending ? copy.sending : copy.sendCode) : pending ? copy.deleting : copy.confirm}
            </button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
