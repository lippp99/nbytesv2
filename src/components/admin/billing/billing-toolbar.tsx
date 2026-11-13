"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Segmented } from "@/components/app-kit/segmented";
import { periodCopy } from "@/components/admin/shared/period-copy";
import { type PeriodPickerProps, PeriodPicker } from "@/components/admin/shared/period-picker";
import { type Currency, type DepositFilter, billingHref } from "@/lib/payments/finance-contract";
import { billingCopy } from "./billing-copy";

type BillingToolbarProps = Omit<PeriodPickerProps, "pending" | "onPick"> & { filter: DepositFilter; currency: Currency };

const currencies = [{ value: "usd" as const, label: "USD" }, { value: "idr" as const, label: "Rupiah" }];

/** Profit currency and period, kept in the URL with the deposit filter; the old figures stay until the new ones arrive. */
export function BillingToolbar({ filter, currency, ...props }: BillingToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  return (
    <div className="flex flex-wrap items-end gap-4">
      <span role="status" className="text-app-small text-app-text-2">{pending ? periodCopy.loading : ""}</span>
      <Segmented label={billingCopy.profit.currencyLabel} options={currencies} value={currency}
        onChange={(next) => go(billingHref(props.period, props.currentMonth, filter, 1, next))} />
      <PeriodPicker {...props} pending={pending}
        onPick={(period) => go(billingHref(period, props.currentMonth, filter, 1, currency))} />
    </div>
  );
}
