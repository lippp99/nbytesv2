import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { usage as copy } from "./usage-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Shown while the usage queries stream in: the real header, then placeholder blocks (skeleton, not a spinner). */
export function UsageSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div role="status" aria-label={copy.loading} className="space-y-6">
        <Card>
          <div className="grid grid-cols-2 gap-6 px-6 py-5 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="space-y-2">
                <span aria-hidden className={`${bar} h-3 w-16`} />
                <span aria-hidden className={`${bar} h-6 w-24`} />
              </span>
            ))}
          </div>
        </Card>
        <Card title={copy.chartTitle}>
          <span aria-hidden className="m-6 block h-52 animate-pulse rounded-app-inner bg-app-hover motion-reduce:animate-none" />
        </Card>
      </div>
    </>
  );
}
