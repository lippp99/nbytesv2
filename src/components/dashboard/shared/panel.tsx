import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = { title?: string; action?: ReactNode; className?: string; children: ReactNode };

/** The one card style of the dashboard: 12px radius, hairline border, optional titled header. */
export function Panel({ title, action, className, children }: PanelProps) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-panel border border-border bg-background", className)}>
      {title && (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
          <h2 className="text-sm font-medium">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
