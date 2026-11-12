"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { dangerAction, primaryAction, secondaryAction } from "@/components/app-kit/button";
import { Field, TextArea, describedBy } from "@/components/app-kit/field";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { setUserStatus } from "@/lib/admin-users/user-admin-client";
import { REASON_MAX, type UserStatus } from "@/lib/admin-users/user-admin-contract";
import { statusErrorText, usersCopy } from "./users-copy";
import { useUsersNotice } from "./users-feedback";

const copy = usersCopy.dialog;

// Same popup frame as the account deletion dialog: ui/alert-dialog merges with the bare `cn`, so overrides need `!`.
const popup =
  "w-[calc(100%-2rem)]! max-w-md! gap-0! overflow-y-auto rounded-app-card! bg-app-raised! p-0! text-app-text! " +
  "shadow-app-raised ring-app-border! max-h-[calc(100dvh-2rem)] max-sm:top-4! max-sm:translate-y-0! motion-reduce:animate-none!";

/** Suspend (with the reason U5 requires) or restore one account, always behind a confirmation (A.7). */
export function StatusDialog({ userId, email, status }: { userId: string; email: string; status: UserStatus }) {
  const router = useRouter();
  const report = useUsersNotice();
  const suspending = status === "active";
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fieldId = `reason-${userId}`;

  function changeOpen(next: boolean) {
    if (pending) return; // never close mid-request
    setOpen(next);
    if (!next) { setReason(""); setError(null); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = reason.trim();
    if (suspending && !text) return setError(copy.reasonRequired);
    if (text.length > REASON_MAX) return setError(copy.reasonTooLong);
    setPending(true);
    const result = await setUserStatus(userId, { status: suspending ? "suspended" : "active", reason: text || null });
    setPending(false);
    if (!result.ok) {
      if (result.error === "unauthorized") return router.push("/admin/login");
      return setError(statusErrorText[result.error]);
    }
    setOpen(false);
    setReason("");
    report({ kind: "status", text: suspending ? copy.suspended(email) : copy.restored(email) });
    router.refresh(); // the row's status comes from the server
  }

  const trigger = suspending ? dangerAction(undefined, "sm") : secondaryAction(undefined, "sm");
  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogTrigger render={<button type="button" className={trigger} aria-label={`${suspending ? usersCopy.suspend : usersCopy.restore} ${email}`} />}>
        {suspending ? usersCopy.suspend : usersCopy.restore}
      </AlertDialogTrigger>
      <AlertDialogContent className={popup}>
        <form noValidate onSubmit={submit}>
          <div className="space-y-2 p-6 pb-5">
            <AlertDialogTitle className="text-app-section! text-app-text">{suspending ? copy.suspendTitle : copy.restoreTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-app-ui! text-app-text-2!">
              {suspending ? copy.suspendBody(email) : copy.restoreBody(email)}
            </AlertDialogDescription>
          </div>
          {suspending ? (
            <div className="px-6 pb-6">
              <Field id={fieldId} label={copy.reason} hint={copy.reasonHint} error={error}>
                <TextArea id={fieldId} value={reason} autoFocus maxLength={REASON_MAX} disabled={pending}
                  aria-invalid={error ? true : undefined} aria-describedby={describedBy(fieldId, { hint: copy.reasonHint, error })}
                  onChange={(e) => { setReason(e.target.value); setError(null); }} />
              </Field>
            </div>
          ) : (
            error && <p role="alert" className="px-6 pb-6 text-app-small text-app-danger">{error}</p>
          )}
          <div className="flex flex-col-reverse gap-3 border-t border-app-border bg-app-inset px-6 py-4 sm:flex-row sm:justify-end">
            <AlertDialogCancel render={<button type="button" disabled={pending} className={secondaryAction()} />}>{copy.cancel}</AlertDialogCancel>
            <button type="submit" disabled={pending} aria-busy={pending || undefined} className={suspending ? dangerAction() : primaryAction()}>
              {pending ? copy.saving : suspending ? copy.confirmSuspend : copy.confirmRestore}
            </button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
