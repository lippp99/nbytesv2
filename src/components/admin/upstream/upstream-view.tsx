import { CloudOffIcon, CubeIcon } from "@hugeicons/core-free-icons";
import { AllClear } from "@/components/admin/shared/all-clear";
import { Badge } from "@/components/app-kit/badge";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import type { SurplusBalance, UpstreamHealth } from "@/lib/admin-gateway/upstream-contract";
import { formatWibStamp } from "@/lib/date-format";
import { formatCents } from "@/lib/price-format";
import { upstreamCopy as copy } from "./upstream-copy";

const mono = "font-mono text-app-code";

/** Credit in figures (mono), the two switches in words: no monospace for what is not a number. */
function Balance({ balance }: { balance: SurplusBalance | null }) {
  const c = copy.balance;
  if (!balance) {
    return (
      <Card title={c.title}>
        {/* a full reload: Surplus is read again on every page view */}
        <EmptyState icon={CloudOffIcon} tone="danger" title={c.failedTitle} body={c.failedBody}
          action={<a href="/admin/upstream" className={secondaryAction()}>{c.reload}</a>} />
      </Card>
    );
  }
  const items = [
    { label: c.credit, value: <span className={`${mono} text-app-section tabular-nums`}>{formatCents(balance.creditMicros)}</span> },
    { label: c.autoTopup, value: balance.autoTopup === null ? c.unknown : balance.autoTopup ? c.on : c.off },
    { label: c.accountStatus, value: balance.accountStatus ?? c.unknown },
  ];
  return (
    <Card title={c.title} description={c.description}>
      <dl className="grid gap-px bg-app-border sm:grid-cols-3">
        {items.map((i) => (
          <div key={i.label} className="bg-app-surface px-6 py-5">
            <dt className="text-app-small text-app-text-2">{i.label}</dt>
            <dd className="mt-1.5 text-app-ui text-app-text">{i.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function Attention({ items, hours }: { items: UpstreamHealth["attention"]; hours: number }) {
  const c = copy.attention;
  return (
    <Card title={c.title} description={c.description(hours)}>
      {items.length === 0 ? (
        <AllClear text={c.none} />
      ) : (
        <Table minWidth="min-w-xl">
          <THead>
            <Th>{c.cols.code}</Th>
            <Th align="right">{c.cols.status}</Th>
            <Th align="right">{c.cols.count}</Th>
            <Th>{c.cols.last}</Th>
          </THead>
          <tbody>
            {items.map((a) => (
              <Tr key={`${a.upstreamErrorCode}-${a.statusCode}`}>
                <Td><Badge tone="danger"><span className={mono}>{a.upstreamErrorCode ?? c.unknownCode}</span></Badge></Td>
                <Td align="right">{a.statusCode ?? "—"}</Td>
                <Td align="right">{a.count.toLocaleString("en-US")}</Td>
                <Td className={`${mono} whitespace-nowrap text-app-text-2 tabular-nums`}>{formatWibStamp(a.lastAt)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function Models({ models, hours }: { models: UpstreamHealth["models"]; hours: number }) {
  const c = copy.models;
  const zeroAsDash = (n: number) => (n ? n.toLocaleString("en-US") : <span className="text-app-text-3">0</span>);
  return (
    <Card title={c.title} description={c.description(hours)}>
      {models.length === 0 ? (
        <EmptyState icon={CubeIcon} title={c.emptyTitle} body={c.emptyBody} />
      ) : (
        <Table minWidth="min-w-4xl">
          <THead>
            <Th>{c.cols.model}</Th>
            <Th align="right">{c.cols.requests}</Th>
            <Th align="right">{c.cols.failed}</Th>
            <Th align="right">{c.cols.unavailable}</Th>
            <Th align="right">{c.cols.latency}</Th>
            <Th align="right">{c.cols.pending}</Th>
            <Th align="right">{c.cols.negative}</Th>
          </THead>
          <tbody>
            {models.map((m) => (
              <Tr key={m.modelId}>
                <Td>
                  <span className={mono}>{m.modelId}</span>
                  {!m.active && <span className="ml-2 text-app-small text-app-text-3">{c.inactive}</span>}
                </Td>
                <Td align="right">{m.requests.toLocaleString("en-US")}</Td>
                <Td align="right">{zeroAsDash(m.failed)}</Td>
                <Td align="right">{zeroAsDash(m.unavailable)}</Td>
                <Td align="right">{m.p50LatencyMs === null ? "—" : `${m.p50LatencyMs.toLocaleString("en-US")} ms`}</Td>
                <Td align="right">{zeroAsDash(m.costPending)}</Td>
                <Td align="right" className={m.negativeMargin ? "text-app-danger" : undefined}>{zeroAsDash(m.negativeMargin)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      <p className="border-t border-app-border bg-app-inset px-6 py-3 text-app-small text-app-text-2">{c.note}</p>
    </Card>
  );
}

/** Surplus balance plus health from nbytes' own requests (R1, R4). No routing switches: Surplus routes. */
export function UpstreamView({ data }: { data: UpstreamHealth }) {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-10">
        <Balance balance={data.balance} />
        <Attention items={data.attention} hours={data.windowHours} />
        <Models models={data.models} hours={data.windowHours} />
      </div>
    </>
  );
}
