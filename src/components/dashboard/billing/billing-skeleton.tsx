import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { billing as copy } from "./billing-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Shown while the balance and deposits stream in: the real header, then placeholder blocks (skeleton, not a spinner). */
export function BillingSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div role="status" aria-label={copy.loading} className="space-y-10">
        <Card>
          <div className="space-y-3 p-6">
            <span aria-hidden className={`${bar} h-3 w-32`} />
            <span aria-hidden className={`${bar} h-7 w-48`} />
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
