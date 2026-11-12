"use client";

import { useState } from "react";
import { dangerAction, secondaryAction } from "@/components/app-kit/button";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { modelsCopy } from "./models-copy";

const copy = modelsCopy.deactivate;
// Same popup frame as the users status dialog: ui/alert-dialog merges with the bare `cn`, so overrides need `!`.
const popup =
  "w-[calc(100%-2rem)]! max-w-md! gap-0! overflow-y-auto rounded-app-card! bg-app-raised! p-0! text-app-text! " +
  "shadow-app-raised ring-app-border! max-h-[calc(100dvh-2rem)] max-sm:top-4! max-sm:translate-y-0! motion-reduce:animate-none!";

type DeactivateDialogProps = { modelId: string; busy: boolean; onConfirm: () => Promise<boolean> };

/** Turning a model off breaks every client that calls it, so it waits for a yes (PRD backend-auth-admin: risky actions). */
export function DeactivateDialog({ modelId, busy, onConfirm }: DeactivateDialogProps) {
  const [open, setOpen] = useState(false);

  async function confirm() {
    await onConfirm();
    setOpen(false); // either way: the result (saved or the error) shows under the table, not hidden behind the dialog
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
      <AlertDialogTrigger render={<button type="button" disabled={busy} className={secondaryAction(undefined, "sm")}
        aria-label={`${modelsCopy.curated.disable} ${modelId}`} />}>
        {modelsCopy.curated.disable}
      </AlertDialogTrigger>
      <AlertDialogContent className={popup}>
        <div className="space-y-2 p-6 pb-5">
          <AlertDialogTitle className="text-app-section! text-app-text">{copy.title}</AlertDialogTitle>
          <AlertDialogDescription className="text-app-ui! text-app-text-2!">{copy.body(modelId)}</AlertDialogDescription>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-app-border bg-app-inset px-6 py-4 sm:flex-row sm:justify-end">
          <AlertDialogCancel render={<button type="button" disabled={busy} className={secondaryAction()} />}>{copy.cancel}</AlertDialogCancel>
          <button type="button" onClick={confirm} disabled={busy} aria-busy={busy || undefined} className={dangerAction()}>
            {busy ? modelsCopy.saving : copy.confirm}
          </button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
