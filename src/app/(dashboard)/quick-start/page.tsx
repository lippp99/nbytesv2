import type { Metadata } from "next";
import { QuickStartView } from "@/components/dashboard/quick-start/quick-start-view";

export const metadata: Metadata = { title: "Quick start" };

export default function Page() {
  return <QuickStartView />;
}
