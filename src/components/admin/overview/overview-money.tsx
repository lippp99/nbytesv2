import type { ReactNode } from "react";
import { AllClear } from "@/components/admin/shared/all-clear";
import { Badge } from "@/components/app-kit/badge";
import { Card } from "@/components/app-kit/card";
import { type MoneyHealth, type OverviewAlert, coverageBp } from "@/lib/admin-overview-contract";
import { formatUtc } from "@/lib/date-format";
import { formatIdr, formatMicros, formatSignedMicros } from "@/lib/price-format";
import { alertText, overviewCopy } from "./overview-copy";

const mono = "font-mono tabular-nums";

/** §3.5: words with a dot badge, no links (owner: no quick navigation on the overview). */
export function OverviewAlerts({ alerts }: { alerts: OverviewAlert[] }) {
  const c = overviewCopy.alerts;
  return (
    <Card title={c.title} description={c.description}>
      {alerts.length === 0 ? (
        <AllClear text={c.none} />
      ) : (
        <ul className="divide-y divide-app-border">
          {alerts.map((a) => (
            <li key={a.kind} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:gap-4">
              <Badge tone={a.tone} className="self-start sm:w-28 sm:shrink-0">{alertText[a.kind].label}</Badge>
              <p className="text-app-ui text-app-text">{alertText[a.kind].text(a.count)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Item({ label, value, note, danger }: { label: string; value: ReactNode; note?: string; danger?: boolean }) {
  return (
    <div className="bg-app-surface px-6 py-5">
      <dt className="text-app-small text-app-text-2">{label}</dt>
      <dd className={`mt-1.5 text-app-section ${danger ? "text-app-danger" : "text-app-text"}`}>{value}</dd>
      {note && <dd className="mt-1 text-app-small text-app-text-3">{note}</dd>}
    </div>
  );
}

/** §3.2: Surplus credit against what users can still spend (K4), the rate and open deposits. */
export function OverviewMoney({ money }: { money: MoneyHealth }) {
  const c = overviewCopy.money;
  const cover = coverageBp(money.surplus?.creditMicros ?? null, money.userBalanceMicros);
  return (
    <Card title={c.title} description={c.description}>
      <dl className="grid gap-px bg-app-border sm:grid-cols-2 lg:grid-cols-3">
        <Item label={c.surplus} danger={!money.surplus}
          value={money.surplus ? <span className={mono}>{formatMicros(money.surplus.creditMicros)}</span> : c.surplusUnread} />
        <Item label={c.users} value={<span className={mono}>{formatSignedMicros(money.userBalanceMicros)}</span>}
          note={money.userHeldMicros > 0 ? c.usersHeld(formatMicros(money.userHeldMicros)) : undefined} />
        <Item label={c.coverage} note={c.coverageNote} danger={cover !== null && cover < 10_000}
          value={cover === null ? c.coverageNone : <span className={mono}>{`${Math.floor(cover / 100)}%`}</span>} />
        <Item label={c.negative} danger={money.negativeBalances > 0} value={<span className={mono}>{money.negativeBalances}</span>} />
        <Item label={c.rate} danger={money.idrPerUsd === null}
          value={money.idrPerUsd === null ? c.rateNone : <span className={mono}>{formatIdr(money.idrPerUsd)} / USD</span>}
          note={money.rateSetAt ? c.rateSet(formatUtc(money.rateSetAt)) : undefined} />
        <Item label={c.deposits} value={<span className={mono}>{money.depositsPending + money.depositsStuck}</span>}
          note={c.depositsNote(money.depositsPending, money.depositsStuck)} danger={money.depositsStuck > 0} />
      </dl>
    </Card>
  );
}
