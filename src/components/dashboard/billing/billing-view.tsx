import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { billing as copy } from "./billing-copy";
import { account, monthlyBudgetMicros, usageTotals } from "@/components/dashboard/shared/dashboard-data";
import { invoices } from "./billing-data";
import { PageHeader } from "@/components/dashboard/shared/page-header";
import { Panel } from "@/components/dashboard/shared/panel";
import { secondaryAction } from "@/components/dashboard/shared/dashboard-buttons";

const statusTone = { paid: "bg-success/10 text-success", open: "bg-accent-soft text-accent-ink" } as const;

export function BillingView() {
  const used = Math.min(100, (usageTotals.costMicros / monthlyBudgetMicros) * 100);
  const cols = copy.cols;
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-2">
          <p className="text-sm text-muted-foreground">{copy.current} · {account.billingPeriod}</p>
          <p className="mt-2 font-mono text-4xl tabular-nums">{formatMicros(usageTotals.costMicros)}</p>
          <div className="mt-6 flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{copy.budget}</span>
            <span className="font-mono">{Math.round(used)}% {copy.used} · {formatMicros(monthlyBudgetMicros)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent-mark" style={{ width: `${used}%` }} />
          </div>
        </Panel>
        <Panel className="flex flex-col p-5">
          <p className="text-sm text-muted-foreground">{copy.plan}</p>
          <p className="mt-1 font-medium">{account.plan}</p>
          <p className="mt-6 text-sm text-muted-foreground">{copy.payment}</p>
          <p className="mt-1 text-sm">{copy.noPayment}</p>
          <button type="button" disabled className={secondaryAction("mt-6 self-start rounded-full")}>
            <HugeiconsIcon icon={CreditCardIcon} aria-hidden />
            {copy.addPayment}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">{copy.paymentLater}</p>
        </Panel>
      </div>
      <Panel title={copy.history} className="mt-3">
        <div className="overflow-x-auto">
          <table className="w-full min-w-lg text-sm">
            <thead className="text-muted-foreground">
              <tr className="text-left">
                <th scope="col" className="py-3 pl-4 font-normal sm:pl-5">{cols.id}</th>
                <th scope="col" className="py-3 font-normal">{cols.period}</th>
                <th scope="col" className="py-3 text-right font-normal">{cols.amount}</th>
                <th scope="col" className="py-3 pr-4 text-right font-normal sm:pr-5">{cols.status}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="py-3 pl-4 font-mono text-code sm:pl-5">{inv.id}</td>
                  <td className="py-3">{inv.period}</td>
                  <td className="py-3 text-right font-mono text-code">{formatMicros(inv.amountMicros)}</td>
                  <td className="py-3 pr-4 text-right sm:pr-5">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs", statusTone[inv.status])}>{copy.status[inv.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
