"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Segmented } from "@/components/app-kit/segmented";
import { periodCopy } from "@/components/admin/shared/period-copy";
import { PeriodPicker } from "@/components/admin/shared/period-picker";
import { USAGE_SORTS, type UsageFilters, type UsageSort, usageHref } from "@/lib/admin-gateway/usage-contract";
import { sortLabels, usageCopy as copy } from "./usage-copy";

const sortOptions = USAGE_SORTS.map((value) => ({ value, label: sortLabels[value] }));
type UsageToolbarProps = {
  query: UsageFilters;
  currentMonth: string;
  /** WIB day the page was rendered. */
  today: string;
  months: { value: string; label: string }[];
  years: string[];
};

/**
 * Period and sort, kept in the URL so the server renders the report (page 1 again). The push runs in a transition:
 * the old report stays until the new one arrives, so `pending` is the sign that it is loading.
 */
export function UsageToolbar({ query, currentMonth, today, months, years }: UsageToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (next: Partial<UsageFilters>) =>
    startTransition(() => router.push(usageHref({ ...query, ...next }, currentMonth), { scroll: false }));

  return (
    <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <PeriodPicker period={query.period} currentMonth={currentMonth} today={today} months={months} years={years}
        pending={pending} onPick={(period) => go({ period })} />
      <div className="flex flex-wrap items-center gap-3">
        <span role="status" className="text-app-small text-app-text-2">{pending ? periodCopy.loading : ""}</span>
        <Segmented<UsageSort> label={copy.sortLabel} options={sortOptions} value={query.sort} onChange={(sort) => go({ sort })} />
      </div>
    </div>
  );
}
