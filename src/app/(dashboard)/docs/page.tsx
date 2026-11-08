import type { Metadata } from "next";
import { DocsView } from "@/components/dashboard/docs/docs-view";

export const metadata: Metadata = { title: "API Docs" };

export default function Page() {
  return <DocsView />;
}
