import type { Metadata } from "next";
import { Suspense } from "react";
import { leaderboardCopy } from "@/components/admin/leaderboard/leaderboard-copy";
import { LeaderboardView } from "@/components/admin/leaderboard/leaderboard-view";
import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { dayOf, monthOf, parsePeriod } from "@/lib/admin-gateway/usage-contract";
import { leaderboard } from "@/lib/server/admin-gateway/leaderboard";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";

export const metadata: Metadata = { title: "Leaderboard · Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Board({ searchParams }: { searchParams: SearchParams }) {
  await getCurrentAdmin();
  const now = new Date();
  const data = await leaderboard(parsePeriod(await searchParams, now), now);
  return <LeaderboardView data={data} currentMonth={monthOf(now)} today={dayOf(now)} />;
}

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ListSkeleton title={leaderboardCopy.title} sub={leaderboardCopy.sub} label={leaderboardCopy.loading} rows={10} />}>
      <Board searchParams={searchParams} />
    </Suspense>
  );
}
