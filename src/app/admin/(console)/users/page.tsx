import type { Metadata } from "next";
import { Suspense } from "react";
import { usersCopy } from "@/components/admin/users/users-copy";
import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { UsersView } from "@/components/admin/users/users-view";
import { parseUserFilter, parseUserSearch } from "@/lib/admin-users/user-admin-contract";
import { parsePageParam } from "@/lib/auth/auth-contract";
import { listUsers } from "@/lib/server/account/user-admin";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";

export const metadata: Metadata = { title: "Users · Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Users({ searchParams }: { searchParams: SearchParams }) {
  await getCurrentAdmin();
  const params = await searchParams;
  const filter = parseUserFilter(params.status);
  const search = parseUserSearch(params.q);
  const data = await listUsers(filter, search, parsePageParam(params.page));
  return <UsersView data={data} filter={filter} search={search} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ListSkeleton title={usersCopy.title} sub={usersCopy.sub} label={usersCopy.loading} rows={6} />}>
      <Users searchParams={searchParams} />
    </Suspense>
  );
}
