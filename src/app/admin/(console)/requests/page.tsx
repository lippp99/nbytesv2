import type { Metadata } from "next";
import { Suspense } from "react";
import { requestsCopy } from "@/components/admin/requests/requests-copy";
import { RequestsView } from "@/components/admin/requests/requests-view";
import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { parseRequestQuery } from "@/lib/admin-gateway/request-log-contract";
import { parsePageParam } from "@/lib/auth/auth-contract";
import { listRequests } from "@/lib/server/admin-gateway/request-log";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";

export const metadata: Metadata = { title: "Request log · Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Requests({ searchParams }: { searchParams: SearchParams }) {
  await getCurrentAdmin();
  const params = await searchParams;
  const { page, ...query } = parseRequestQuery(params, parsePageParam(params.page));
  const data = await listRequests({ ...query, page });
  return <RequestsView data={data} query={query} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ListSkeleton title={requestsCopy.title} sub={requestsCopy.sub} label={requestsCopy.loading} rows={10} />}>
      <Requests searchParams={searchParams} />
    </Suspense>
  );
}
