import { Card } from "./card";
import { PageHeader } from "./page-header";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

type ListSkeletonProps = { title: string; sub?: string; label: string; rows?: number };

/** Loading state of a list page: the real header, then placeholder rows in one card (skeleton, not a spinner). */
export function ListSkeleton({ title, sub, label, rows = 6 }: ListSkeletonProps) {
  return (
    <>
      <PageHeader title={title} sub={sub} />
      <Card>
        <div role="status" aria-label={label} className="divide-y divide-app-border">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex items-center justify-between gap-4 px-6 py-4">
              <span aria-hidden className={`${bar} h-3 w-1/3`} />
              <span aria-hidden className={`${bar} h-3 w-24`} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
