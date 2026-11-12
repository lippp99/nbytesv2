import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { modelsCopy as copy } from "./models-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Shown while the curated rows and the Surplus catalog load: the real header, then placeholder rows. */
export function ModelsSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div role="status" aria-label={copy.loading} className="space-y-10">
        {[3, 6].map((rows) => (
          <Card key={rows}>
            <div className="divide-y divide-app-border">
              {Array.from({ length: rows }, (_, row) => (
                <div key={row} className="flex items-center justify-between gap-4 px-6 py-4">
                  <span aria-hidden className={`${bar} h-3 w-1/3`} />
                  <span aria-hidden className={`${bar} h-3 w-24`} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
