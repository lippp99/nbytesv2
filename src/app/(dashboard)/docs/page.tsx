import type { Metadata } from "next";
import { Suspense } from "react";
import { docs } from "@/components/dashboard/docs/docs-copy";
import { DocsView } from "@/components/dashboard/docs/docs-view";
import { ListSkeleton } from "@/components/app-kit/list-skeleton";
import { authEnv } from "@/lib/server/auth/auth-env";
import { currentPlatformSettings } from "@/lib/server/platform/settings";

export const metadata: Metadata = { title: "API Docs" };

/** Server values: the base URL (this deployment's origin plus /api/v1, gateway-api A1) and the admin's key rate limit. */
async function Docs() {
  const { keyRpm } = await currentPlatformSettings();
  return <DocsView baseUrl={`${authEnv().appOrigin}/api/v1`} keyRpm={keyRpm} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton title={docs.title} label={docs.loading} rows={6} />}>
      <Docs />
    </Suspense>
  );
}
