import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = { title?: string; description?: string; action?: ReactNode; className?: string; children: ReactNode };

/**
 * The one container of the dashboard: flat surface, 1px border, 16px radius, no shadow. With a title it gets a
 * header row; the body is left to the caller so tables can run edge to edge and forms can use p-6.
 */
export function Card({ title, description, action, className, children }: CardProps) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-app-card border border-app-border bg-app-surface", className)}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-app-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-app-card text-app-text">{title}</h2>
            {description && <p className="mt-0.5 text-app-small text-app-text-2">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
