import Link from "next/link";
import { cn } from "@/lib/utils";
import { secondaryAction } from "./button";

export type PaginationLabels = { nav: string; pageOf: (page: number, pages: number) => string; previous: string; next: string };
type PaginationProps = { page: number; pages: number; href: (page: number) => string; labels: PaginationLabels };

function Step({ to, enabled, label }: { to: string; enabled: boolean; label: string }) {
  if (!enabled) {
    return <span aria-disabled="true" className={cn(secondaryAction("", "sm"), "pointer-events-none opacity-50")}>{label}</span>;
  }
  return <Link href={to} scroll={false} className={secondaryAction("", "sm")}>{label}</Link>;
}

/** Previous / next links under a server-paged table (the page lives in the URL); nothing when there is one page. */
export function Pagination({ page, pages, href, labels }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={labels.nav} className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-6 py-4">
      <p className="text-app-small text-app-text-2 tabular-nums">{labels.pageOf(page, pages)}</p>
      <div className="flex gap-2">
        <Step to={href(page - 1)} enabled={page > 1} label={labels.previous} />
        <Step to={href(page + 1)} enabled={page < pages} label={labels.next} />
      </div>
    </nav>
  );
}
