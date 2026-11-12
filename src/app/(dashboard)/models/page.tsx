import type { Metadata } from "next";
import { Suspense } from "react";
import { ModelsSkeleton } from "@/components/dashboard/models/models-skeleton";
import { ModelsView } from "@/components/dashboard/models/models-view";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { listCatalogForUsers } from "@/lib/server/gateway/catalog";

export const metadata: Metadata = { title: "Models" };

/** Reads the session itself (layouts do not re-run on navigation); no cache, so prices match what is charged. */
async function Models() {
  await getCurrentUser();
  return <ModelsView models={await listCatalogForUsers()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ModelsSkeleton />}>
      <Models />
    </Suspense>
  );
}
