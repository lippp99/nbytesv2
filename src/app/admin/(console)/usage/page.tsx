import type { Metadata } from "next";
import { Suspense } from "react";
import { usageCopy } from "@/components/admin/usage/usage-copy";
import { UsageView } from "@/components/admin/usage/usage-view";
import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { dayOf, monthOf, parseUsageQuery } from "@/lib/admin-gateway/usage-contract";
import { parsePageParam } from "@/lib/auth/auth-contract";
import { usageReport } from "@/lib/server/admin-gateway/usage-report";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";

export const metadata: Metadata = { title: "Usage · Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Usage({ searchParams }: { searchParams: SearchParams }) {
  await getCurrentAdmin();
  const params = await searchParams;
  const now = new Date();
  const { page, modelPage, ...query } = parseUsageQuery(
    params, { page: parsePageParam(params.page), modelPage: parsePageParam(params.mpage) }, now,
  );
  const data = await usageReport({ ...query, page, modelPage }, now);
  return <UsageView data={data} query={query} currentMonth={monthOf(now)} today={dayOf(now)} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ListSkeleton title={usageCopy.title} sub={usageCopy.sub} label={usageCopy.loading} rows={10} />}>
      <Usage searchParams={searchParams} />
    </Suspense>
  );
}
