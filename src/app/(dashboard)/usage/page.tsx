import type { Metadata } from "next";
import { UsageView } from "@/components/dashboard/usage/usage-view";

export const metadata: Metadata = { title: "Usage" };

export default function Page() {
  return <UsageView />;
}
