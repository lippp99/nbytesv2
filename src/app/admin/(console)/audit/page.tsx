import type { Metadata } from "next";
import { Suspense } from "react";
import { auditCopy } from "@/components/admin/audit/audit-copy";
import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { AuditView } from "@/components/admin/audit/audit-view";
import { parseAuditFilter } from "@/lib/admin-auth/audit-contract";
import { parsePageParam } from "@/lib/auth/auth-contract";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";
import { listAuditEvents } from "@/lib/server/admin-auth/audit-list";

export const metadata: Metadata = { title: "Audit log · Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Audit({ searchParams }: { searchParams: SearchParams }) {
  await getCurrentAdmin();
  const params = await searchParams;
  const filter = parseAuditFilter(params.type);
  const data = await listAuditEvents(filter, parsePageParam(params.page));
  return <AuditView data={data} filter={filter} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ListSkeleton title={auditCopy.title} sub={auditCopy.sub} label={auditCopy.loading} rows={8} />}>
      <Audit searchParams={searchParams} />
    </Suspense>
  );
}
