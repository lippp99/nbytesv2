import type { Metadata } from "next";
import { Suspense } from "react";
import { cheapestModels } from "@/components/dashboard/quick-start/quick-start-data";
import { QuickStartSkeleton } from "@/components/dashboard/quick-start/quick-start-skeleton";
import { QuickStartView } from "@/components/dashboard/quick-start/quick-start-view";
import { authEnv } from "@/lib/server/auth/auth-env";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { countActiveApiKeys } from "@/lib/server/gateway/api-keys";
import { listCatalogForUsers } from "@/lib/server/gateway/catalog";
import { userBalance } from "@/lib/server/payments/user-billing";
import { setupFacts } from "@/lib/server/usage/setup-progress";

export const metadata: Metadata = { title: "Quick start" };

/** Reads the session itself (layouts do not re-run on navigation); every fact is this user's, read in parallel. */
async function QuickStart() {
  const user = await getCurrentUser();
  const [keyCount, models, balance, facts] = await Promise.all([
    countActiveApiKeys(user.id), listCatalogForUsers(), userBalance(user.id), setupFacts(user.id),
  ]);
  return (
    <QuickStartView data={{
      name: user.firstName ?? user.email,
      email: user.email,
      // B7: a balance at or below zero refuses every request, so only a positive balance completes the step.
      progress: { hasKey: keyCount > 0, hasBalance: balance.balanceMicros > 0, ...facts },
      keyCount,
      modelCount: models.length,
      cheapest: cheapestModels(models),
      baseUrl: `${authEnv().appOrigin}/api/v1`,
    }} />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<QuickStartSkeleton />}>
      <QuickStart />
    </Suspense>
  );
}
