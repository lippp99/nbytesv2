import type { Metadata } from "next";
import { DocsView } from "@/components/dashboard/docs/docs-view";
import { authEnv } from "@/lib/server/auth/auth-env";

export const metadata: Metadata = { title: "API Docs" };

/** Static reference; the only server value is the base URL: this deployment's origin plus /api/v1 (gateway-api A1). */
export default function Page() {
  return <DocsView baseUrl={`${authEnv().appOrigin}/api/v1`} />;
}
