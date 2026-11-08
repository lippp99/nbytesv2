import type { Metadata } from "next";
import { BillingView } from "@/components/dashboard/billing/billing-view";

export const metadata: Metadata = { title: "Billing" };

export default function Page() {
  return <BillingView />;
}
