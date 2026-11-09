import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { settings as copy } from "./settings-copy";

const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

/** Shown while the account loads: the real header, then the profile card's shape (skeleton, not a spinner). */
export function SettingsSkeleton() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-10">
        <span aria-hidden className={`${bar} h-4 w-24`} />
        <Card className="lg:col-span-2">
          <div role="status" aria-label={copy.loading} className="grid gap-6 p-6 sm:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i === 2 ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                <span aria-hidden className={`${bar} h-3 w-24`} />
                <span aria-hidden className={`${bar} h-10 w-full rounded-app-control`} />
              </span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
