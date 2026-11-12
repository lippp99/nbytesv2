import { overviewCopy } from "./overview-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Placeholder rows for one overview section while it streams in (skeleton, not a spinner). */
export function OverviewSkeleton({ rows }: { rows: number }) {
  return (
    <div role="status" aria-label={overviewCopy.loading}
      className="divide-y divide-app-border rounded-app-card border border-app-border bg-app-surface">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex justify-between gap-4 px-6 py-4">
          <span aria-hidden className={`${bar} h-3 w-1/3`} />
          <span aria-hidden className={`${bar} h-3 w-24`} />
        </div>
      ))}
    </div>
  );
}
