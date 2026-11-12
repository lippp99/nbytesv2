import { AlertCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export type Notice = { kind: "status" | "error"; text: string };

/**
 * The result of an action, next to what it changed: a check (status, polite) or an alert icon (error, announced at
 * once) plus the words. Status colour is never alone (dashboard-design §3). Not a toast: it stays until the next action.
 */
export function NoticeLine({ notice, size = "ui", className }: { notice: Notice; size?: "ui" | "small"; className?: string }) {
  const ok = notice.kind === "status";
  return (
    <p role={ok ? "status" : "alert"} className={cn("flex items-start gap-2", size === "ui" ? "text-app-ui" : "text-app-small",
      ok ? "text-app-text" : "text-app-danger", className)}>
      <HugeiconsIcon icon={ok ? CheckmarkCircle02Icon : AlertCircleIcon} aria-hidden
        className={cn("shrink-0", size === "ui" ? "mt-0.5 size-4.5" : "mt-px size-4", ok ? "text-app-success" : "text-app-danger")} />
      {notice.text}
    </p>
  );
}
