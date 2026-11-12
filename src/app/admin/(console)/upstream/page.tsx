import type { Metadata } from "next";
import { Suspense } from "react";
import { upstreamCopy } from "@/components/admin/upstream/upstream-copy";
import { UpstreamView } from "@/components/admin/upstream/upstream-view";
import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { upstreamHealth } from "@/lib/server/admin-gateway/upstream-health";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";

export const metadata: Metadata = { title: "Upstream · Admin" };

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Upstream() {
  await getCurrentAdmin();
  return <UpstreamView data={await upstreamHealth()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton title={upstreamCopy.title} sub={upstreamCopy.sub} label={upstreamCopy.loading} />}>
      <Upstream />
    </Suspense>
  );
}
