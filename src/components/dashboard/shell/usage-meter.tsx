import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { account, monthlyBudgetMicros, usageTotals } from "@/components/dashboard/shared/dashboard-data";
import { formatMicros } from "@/lib/price-format";
import { shellCopy } from "./shell-copy";

/** This month's bill against the monthly limit, always in view at the foot of the sidebar. */
export function UsageMeter() {
  const used = Math.min(100, Math.round((usageTotals.costMicros / monthlyBudgetMicros) * 100));
  return (
    <div className="rounded-panel border border-border p-3">
      <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span>{shellCopy.billLabel} · {account.billingPeriod.split(" ")[0]}</span>
        <span className="font-mono">{used}%</span>
      </div>
      <p className="mt-1 font-mono text-lg tabular-nums">{formatMicros(usageTotals.costMicros)}</p>
      <div
        role="meter"
        aria-label={shellCopy.billLabel}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-accent-mark" style={{ width: `${used}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {shellCopy.ofLimit} <span className="font-mono">{formatMicros(monthlyBudgetMicros)}</span>
      </p>
      <Link href="/usage" className={`group mt-3 inline-flex items-center gap-1 rounded-sm text-xs font-medium text-accent-ink ${focusRing}`}>
        {shellCopy.seeUsage}
        <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
