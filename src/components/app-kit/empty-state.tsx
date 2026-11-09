import type { ReactNode } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

type EmptyStateProps = { icon: IconSvgElement; title: string; body: string; action?: ReactNode; className?: string };

/** What goes here and the one step that fills it; never just "nothing here". */
export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span aria-hidden className="grid size-10 place-items-center rounded-app-control bg-app-accent-soft text-app-accent-text">
        <HugeiconsIcon icon={icon} className="size-5" />
      </span>
      <h3 className="mt-4 text-app-card text-app-text">{title}</h3>
      <p className="mt-1 max-w-sm text-app-ui text-app-text-2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
