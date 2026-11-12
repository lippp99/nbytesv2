import type { Metadata } from "next";
import { Suspense } from "react";
import { PlaygroundSkeleton } from "@/components/dashboard/playground/playground-skeleton";
import { PlaygroundView } from "@/components/dashboard/playground/playground-view";
import { authEnv } from "@/lib/server/auth/auth-env";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { listCatalogForUsers } from "@/lib/server/gateway/catalog";

export const metadata: Metadata = { title: "Playground" };

/**
 * Reads the session itself (layouts do not re-run on navigation). Base URL for the Code tab: this deployment's own
 * origin plus the decided path /api/v1 (gateway-api A1); APP_URL is not a secret.
 */
async function Playground() {
  await getCurrentUser(); // no session -> /login
  const models = await listCatalogForUsers();
  return <PlaygroundView models={models} baseUrl={`${authEnv().appOrigin}/api/v1`} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PlaygroundSkeleton />}>
      <Playground />
    </Suspense>
  );
}
