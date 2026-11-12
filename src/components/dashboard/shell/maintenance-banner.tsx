import { Alert02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { shellCopy } from "./shell-copy";

/**
 * Shown on every dashboard page while the admin has maintenance on: the API and the Playground answer 503 then,
 * the rest of the dashboard (balance, keys, billing) stays usable. The admin's text, then what it means.
 */
export function MaintenanceBanner({ text }: { text: string }) {
  return (
    <div role="status" className="border-b border-app-border bg-app-surface px-5 py-3 lg:px-10">
      <p className="mx-auto flex w-full max-w-app items-start gap-2.5 text-app-ui text-app-text">
        <HugeiconsIcon icon={Alert02Icon} aria-hidden className="mt-0.5 size-4.5 shrink-0 text-app-warning" />
        <span><span className="font-medium">{text}</span> <span className="text-app-text-2">{shellCopy.maintenanceNote}</span></span>
      </p>
    </div>
  );
}
