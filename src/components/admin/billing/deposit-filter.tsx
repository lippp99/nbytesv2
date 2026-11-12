"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Segmented } from "@/components/app-kit/segmented";
import { DEPOSIT_FILTERS, type DepositFilter } from "@/lib/payments/finance-contract";
import { billingCopy, filterLabels } from "./billing-copy";

const options = DEPOSIT_FILTERS.map((value) => ({ value, label: filterLabels[value] }));

/**
 * Status filter kept in the URL (?status=), so the server renders the list and a reload keeps it. Resets to page 1.
 * The push runs in a transition so `pending` can say the list is loading (docs: guides/interactive-apps).
 */
export function DepositFilterControl({ value }: { value: DepositFilter }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex flex-wrap items-center gap-3">
      <span role="status" className="text-app-small text-app-text-2">{pending ? billingCopy.deposits.loadingResults : ""}</span>
      <Segmented label={billingCopy.deposits.filterLabel} options={options} value={value} className="flex-wrap"
        onChange={(next) => startTransition(() =>
          router.push(next === "all" ? "/admin/billing" : `/admin/billing?status=${next}`, { scroll: false }))} />
    </span>
  );
}
