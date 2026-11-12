import Link from "next/link";
import { AlertCircleIcon, CheckmarkCircle02Icon, Clock01Icon, Exchange01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ghostAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import type { DepositRules, UserBalance, UserDeposit } from "@/lib/payments/deposit-contract";
import { formatMicros, formatSignedMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { billing as copy } from "./billing-copy";
import { DepositForm } from "./deposit-form";
import { DepositHistory } from "./deposit-history";

export type BillingViewProps = {
  balance: UserBalance;
  /** null while the admin has not set a rate: deposits are closed (PRD §5.6). */
  idrPerUsd: number | null;
  rules: DepositRules;
  history: { deposits: UserDeposit[]; page: number; pages: number };
  /** The deposit Sumopod just sent the user back from, if it is theirs. */
  returned: UserDeposit | null;
};

// Icon per state; the words carry the meaning, the colour only repeats it (dashboard-design §3).
const returnIcon: Record<UserDeposit["state"], { icon: IconSvgElement; tone: string }> = {
  paid: { icon: CheckmarkCircle02Icon, tone: "text-app-success" },
  pending: { icon: Clock01Icon, tone: "text-app-warning" },
  stuck: { icon: AlertCircleIcon, tone: "text-app-danger" },
  failed: { icon: AlertCircleIcon, tone: "text-app-danger" },
  expired: { icon: Clock01Icon, tone: "text-app-text-3" },
};

/** What we know about the deposit Sumopod sent the user back from; Close drops ?deposit= so it does not come back. */
function ReturnNotice({ deposit }: { deposit: UserDeposit }) {
  const text = deposit.state === "paid" ? copy.returned.paid(formatMicros(deposit.creditMicros)) : copy.returned[deposit.state];
  const bad = deposit.state === "failed" || deposit.state === "stuck";
  const { icon, tone } = returnIcon[deposit.state];
  return (
    <div role={bad ? "alert" : "status"} className={cn("flex flex-wrap items-start gap-x-3 gap-y-2 rounded-app-control border",
      "bg-app-surface px-4 py-3 text-app-ui text-app-text", bad ? "border-app-danger/40" : "border-app-border")}>
      <HugeiconsIcon icon={icon} aria-hidden className={cn("mt-0.5 size-4.5 shrink-0", tone)} />
      <p className="min-w-0 flex-1 basis-60">{text}</p>
      <span className="-my-1 flex gap-1">
        {/* a full reload: the webhook may have landed since */}
        {deposit.state === "pending" && <a href={`/billing?deposit=${deposit.id}`} className={ghostAction("", "sm")}>{copy.returned.check}</a>}
        <Link href="/billing" scroll={false} className={ghostAction("", "sm")}>{copy.returned.close}</Link>
      </span>
    </div>
  );
}

function BalanceCard({ balance }: { balance: UserBalance }) {
  const available = balance.balanceMicros - balance.heldMicros;
  return (
    <Card>
      <div className="p-6">
        <p className="text-app-ui text-app-text-2">{copy.balance}</p>
        <p className={cn("mt-2 font-mono text-app-title tabular-nums", available < 0 ? "text-app-danger" : "text-app-text")}>
          {formatSignedMicros(available)}
        </p>
        {balance.heldMicros > 0 && <p className="mt-1 text-app-small text-app-text-2">{copy.held(formatMicros(balance.heldMicros))}</p>}
        <p className="mt-1 text-app-small text-app-text-3">{available < 0 ? copy.negative : copy.balanceNote}</p>
      </div>
    </Card>
  );
}

/** Prepaid: the balance, the deposit form, then the user's deposits. Usage history comes with the gateway. */
export function BillingView({ balance, idrPerUsd, rules, history, returned }: BillingViewProps) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-10">
        {returned && <ReturnNotice deposit={returned} />}
        <BalanceCard balance={balance} />
        <Card title={copy.deposit.title} description={copy.deposit.description}>
          <div id="deposit">
            {idrPerUsd ? (
              <DepositForm idrPerUsd={idrPerUsd} rules={rules} />
            ) : (
              <EmptyState icon={Exchange01Icon} title={copy.deposit.closedTitle} body={copy.deposit.closedBody} />
            )}
          </div>
        </Card>
        <DepositHistory {...history} />
      </div>
    </>
  );
}
