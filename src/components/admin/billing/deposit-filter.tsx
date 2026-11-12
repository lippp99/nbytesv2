"use client";

import { useRouter } from "next/navigation";
import { Segmented } from "@/components/app-kit/segmented";
import { DEPOSIT_FILTERS, type DepositFilter } from "@/lib/payments/finance-contract";
import { billingCopy, filterLabels } from "./billing-copy";

const options = DEPOSIT_FILTERS.map((value) => ({ value, label: filterLabels[value] }));

/** Status filter kept in the URL (?status=), so the server renders the list and a reload keeps it. Resets to page 1. */
export function DepositFilterControl({ value }: { value: DepositFilter }) {
  const router = useRouter();
  return (
    <Segmented label={billingCopy.deposits.filterLabel} options={options} value={value} className="flex-wrap"
      onChange={(next) => router.push(next === "all" ? "/admin/billing" : `/admin/billing?status=${next}`, { scroll: false })} />
  );
}
