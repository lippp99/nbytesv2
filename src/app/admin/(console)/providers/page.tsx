import type { Metadata } from "next";
import { ProvidersView } from "@/components/admin/providers/providers-view";

export const metadata: Metadata = { title: "Provider · Admin" };

export default function Page() {
  return <ProvidersView />;
}
