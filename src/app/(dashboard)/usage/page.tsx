import type { Metadata } from "next";
import { Suspense } from "react";
import { UsageSkeleton } from "@/components/dashboard/usage/usage-skeleton";
import { UsageView } from "@/components/dashboard/usage/usage-view";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { userUsage } from "@/lib/server/usage/user-usage";

export const metadata: Metadata = { title: "Usage" };

/** Reads the session itself (layouts do not re-run on navigation); every query is scoped to this user. */
async function Usage() {
  const user = await getCurrentUser();
  return <UsageView data={await userUsage(user.id)} />;
}

export default function Page() {
  return (
    <Suspense fallback={<UsageSkeleton />}>
      <Usage />
    </Suspense>
  );
}
