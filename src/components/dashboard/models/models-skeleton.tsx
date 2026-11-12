import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { modelsCopy as copy } from "./models-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Shown while the catalog streams in: the real header, then placeholder rows (skeleton, not a spinner). */
export function ModelsSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Card>
        <div role="status" aria-label={copy.loading} className="divide-y divide-app-border">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center justify-between gap-4 px-6 py-4">
              <span className="w-1/3 space-y-2">
                <span aria-hidden className={`${bar} h-3 w-3/4`} />
                <span aria-hidden className={`${bar} h-3 w-1/2`} />
              </span>
              <span aria-hidden className={`${bar} h-3 w-16`} />
              <span aria-hidden className={`${bar} h-3 w-24`} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
