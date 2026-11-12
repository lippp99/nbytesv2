import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/** "Nothing needs action" inside a card (overview alerts, upstream attention): check icon + words, not a bare line. */
export function AllClear({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-2 px-6 py-4 text-app-ui text-app-text">
      <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="mt-0.5 size-4.5 shrink-0 text-app-success" />
      {text}
    </p>
  );
}
