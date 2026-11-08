import type { Metadata } from "next";
import { ApiKeysView } from "@/components/dashboard/api-keys/api-keys-view";

export const metadata: Metadata = { title: "API Keys" };

export default function Page() {
  return <ApiKeysView />;
}
