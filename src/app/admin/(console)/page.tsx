import type { Metadata } from "next";
import { OverviewView } from "@/components/admin/overview/overview-view";

export const metadata: Metadata = { title: "Ringkasan · Admin" };

export default function Page() {
  return <OverviewView />;
}
