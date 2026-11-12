import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { billingCopy as copy } from "./billing-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Shown while the finance data streams in: the real header, then placeholder blocks (skeleton, not a spinner). */
export function BillingSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div role="status" aria-label={copy.loading} className="space-y-10">
        <Card>
          <div className="grid grid-cols-2 gap-px bg-app-border lg:grid-cols-4">
            {[0, 1, 2, 3].map((cell) => (
              <span key={cell} className="space-y-3 bg-app-surface px-6 py-5">
                <span aria-hidden className={`${bar} h-3 w-1/2`} />
                <span aria-hidden className={`${bar} h-5 w-3/4`} />
              </span>
            ))}
          </div>
        </Card>
        {[0, 1].map((card) => (
          <Card key={card}>
            <div className="divide-y divide-app-border">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center justify-between gap-4 px-6 py-4">
                  <span aria-hidden className={`${bar} h-3 w-1/3`} />
                  <span aria-hidden className={`${bar} h-3 w-20`} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
