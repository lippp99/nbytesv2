import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { quickStartCopy as copy } from "./quick-start-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Shown while the account facts stream in: the real title, then the checklist and side cards as placeholders. */
export function QuickStartSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} />
      <div role="status" aria-label={copy.loading} className="grid gap-6 lg:grid-cols-3">
        <Card title={copy.setup} className="lg:col-span-2 lg:self-start">
          <div className="space-y-6 p-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="flex items-center gap-4">
                <span aria-hidden className="size-7 shrink-0 animate-pulse rounded-full bg-app-hover motion-reduce:animate-none" />
                <span aria-hidden className={`${bar} h-3 w-1/2`} />
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <div className="space-y-3 p-6">
            <span aria-hidden className={`${bar} h-10 w-full rounded-app-code`} />
            <span aria-hidden className={`${bar} h-3 w-2/3`} />
            <span aria-hidden className={`${bar} h-3 w-1/2`} />
          </div>
        </Card>
      </div>
    </>
  );
}
