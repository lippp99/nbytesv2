import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/** The message under a field that caused it: icon + words in the error tone, announced as an alert. */
export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} role="alert" className="mt-2 flex items-start gap-2 text-sm text-destructive">
      <HugeiconsIcon icon={AlertCircleIcon} aria-hidden className="mt-px size-4.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
