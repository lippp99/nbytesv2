import type { Metadata } from "next";
import { Suspense } from "react";
import { ModelsSkeleton } from "@/components/admin/models/models-skeleton";
import { ModelsView } from "@/components/admin/models/models-view";
import { getCurrentAdmin } from "@/lib/server/admin-auth/current-admin";
import { adminCatalog } from "@/lib/server/admin-gateway/catalog-admin";

export const metadata: Metadata = { title: "Model & harga · Admin" };

/** Checks the admin session next to the data (the layout gate does not keep a page's output out of the response). */
async function Models() {
  await getCurrentAdmin();
  const { curated, surplus } = await adminCatalog();
  return <ModelsView curated={curated} surplus={surplus} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ModelsSkeleton />}>
      <Models />
    </Suspense>
  );
}
