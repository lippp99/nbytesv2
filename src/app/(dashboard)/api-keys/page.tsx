import type { Metadata } from "next";
import { Suspense } from "react";
import { ApiKeysSkeleton } from "@/components/dashboard/api-keys/api-keys-skeleton";
import { ApiKeysView } from "@/components/dashboard/api-keys/api-keys-view";
import { getCurrentUser } from "@/lib/server/auth/current-user";
import { listUserApiKeys } from "@/lib/server/gateway/api-keys";

export const metadata: Metadata = { title: "API Keys" };

/** Reads the session itself (layouts do not re-run on navigation); the list is scoped to this user. */
async function ApiKeys() {
  const user = await getCurrentUser();
  return <ApiKeysView keys={await listUserApiKeys(user.id)} />;
}

export default function Page() {
  return (
    <Suspense fallback={<ApiKeysSkeleton />}>
      <ApiKeys />
    </Suspense>
  );
}
