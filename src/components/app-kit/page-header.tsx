import type { ReactNode } from "react";

type PageHeaderProps = { title: string; sub?: string; action?: ReactNode };

/** Top of every dashboard page: the h1, one line on what the page is for, actions on the right. Nothing above the h1. */
export function PageHeader({ title, sub, action }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-8">
      <div className="min-w-0 max-w-2xl">
        <h1 className="font-heading text-app-title text-balance text-app-text">{title}</h1>
        {sub && <p className="mt-2 text-app-body text-app-text-2">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}
