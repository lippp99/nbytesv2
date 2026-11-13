"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Segmented } from "@/components/app-kit/segmented";
import type { UsagePeriod } from "@/lib/admin-gateway/usage-contract";
import { type Currency, DEPOSIT_FILTERS, type DepositFilter, billingHref } from "@/lib/payments/finance-contract";
import { billingCopy, filterLabels } from "./billing-copy";

const options = DEPOSIT_FILTERS.map((value) => ({ value, label: filterLabels[value] }));

/**
 * Status filter kept in the URL (?status=), so the server renders the list and a reload keeps it. Resets to page 1 and
 * keeps the profit period and currency.
 * The push runs in a transition so `pending` can say the list is loading (docs: guides/interactive-apps).
 */
type DepositFilterProps = { value: DepositFilter; period: UsagePeriod; currency: Currency; currentMonth: string };

export function DepositFilterControl({ value, period, currency, currentMonth }: DepositFilterProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <span className="flex flex-wrap items-center gap-3">
      <span role="status" className="text-app-small text-app-text-2">{pending ? billingCopy.deposits.loadingResults : ""}</span>
      <Segmented label={billingCopy.deposits.filterLabel} options={options} value={value} className="flex-wrap"
        onChange={(next) => startTransition(() =>
          router.push(billingHref(period, currentMonth, next, 1, currency), { scroll: false }))} />
    </span>
  );
}
