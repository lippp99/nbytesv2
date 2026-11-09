import Link from "next/link";
import { secondaryAction } from "@/components/app-kit/button";
import { cn } from "@/lib/utils";
import { sessionsCopy as copy } from "./sessions-copy";

const href = (page: number) => (page <= 1 ? "/sessions" : `/sessions?page=${page}`);

function Step({ page, enabled, label }: { page: number; enabled: boolean; label: string }) {
  if (!enabled) {
    return <span aria-disabled="true" className={cn(secondaryAction("", "sm"), "pointer-events-none opacity-50")}>{label}</span>;
  }
  return <Link href={href(page)} className={secondaryAction("", "sm")}>{label}</Link>;
}

/** "Halaman X dari Y" with previous / next; only rendered when there is more than one page. */
export function SessionsPagination({ page, pages }: { page: number; pages: number }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={copy.pagination} className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border px-6 py-4">
      <p className="text-app-small text-app-text-2 tabular-nums">{copy.pageOf(page, pages)}</p>
      <div className="flex gap-2">
        <Step page={page - 1} enabled={page > 1} label={copy.previous} />
        <Step page={page + 1} enabled={page < pages} label={copy.next} />
      </div>
    </nav>
  );
}
