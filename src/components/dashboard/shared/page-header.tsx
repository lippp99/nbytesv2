import type { ReactNode } from "react";

/** Page title, one-line description and an optional action on the right. */
export function PageHeader({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-prose">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">{sub}</p>
      </div>
      {action}
    </div>
  );
}
