import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SessionsSkeleton } from "@/components/dashboard/sessions/sessions-skeleton";
import { SessionsView } from "@/components/dashboard/sessions/sessions-view";
import { parsePageParam } from "@/lib/auth/auth-contract";
import { listActiveSessions } from "@/lib/server/auth/session";

export const metadata: Metadata = { title: "Active Sessions" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Reads the session itself (layouts do not re-run on navigation), so the list never trusts the layout check. */
async function Sessions({ searchParams }: { searchParams: SearchParams }) {
  const data = await listActiveSessions(parsePageParam((await searchParams).page));
  if (!data) redirect("/login?next=%2Fsessions");
  return <SessionsView data={data} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<SessionsSkeleton />}>
      <Sessions searchParams={searchParams} />
    </Suspense>
  );
}
