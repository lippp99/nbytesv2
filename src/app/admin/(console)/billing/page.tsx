import type { Metadata } from "next";
import { BillingView } from "@/components/admin/billing/billing-view";

export const metadata: Metadata = { title: "Keuangan · Admin" };

export default function Page() {
  return <BillingView />;
}
