import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/app-kit/badge";
import { ghostAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { type SummaryStat, StatSummary } from "@/components/app-kit/stat-summary";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { ProviderLogo } from "@/components/provider-logo";
import { formatUtc } from "@/lib/date-format";
import { providerById } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { providerHealth, providerStateBadge } from "../shared/provider-health";
import { alerts, overviewCopy as copy, overviewFigures as f } from "./overview-copy";

const stats: SummaryStat[] = [
  { label: copy.stats.revenue, value: formatMicros(f.revenueMicros), note: f.revenueNote },
  { label: copy.stats.users, value: f.activeUsers.toLocaleString("en-US"), note: f.usersNote },
  { label: copy.stats.requests, value: f.requests24h.toLocaleString("en-US"), note: f.requestsNote },
  { label: copy.stats.errors, value: f.errorRatePct, note: f.errorNote, tone: "danger" },
];

function ProviderStatus() {
  const cols = copy.cols;
  return (
    <Card title={copy.providers} description={copy.providersSub} className="lg:col-span-3"
      action={<Link href="/admin/providers" className={ghostAction("-mr-2", "sm")}>{copy.seeAll}<HugeiconsIcon icon={ArrowRight01Icon} aria-hidden /></Link>}>
      <Table minWidth="min-w-md">
        <THead>
          <Th>{cols.provider}</Th>
          <Th>{cols.status}</Th>
          <Th align="right">{cols.latency}</Th>
          <Th align="right">{cols.errors}</Th>
        </THead>
        <tbody>
          {providerHealth.map((p) => {
            const provider = providerById(p.providerId);
            const badge = providerStateBadge[p.state];
            return (
              <Tr key={p.providerId}>
                <Td>
                  <span className="flex items-center gap-2.5">
                    {provider && <ProviderLogo icon={provider.icon} className="size-4 shrink-0" />}
                    {provider?.name ?? p.providerId}
                  </span>
                </Td>
                <Td><Badge tone={badge.tone}>{badge.label}</Badge></Td>
                <Td align="right">{p.latencyP50Ms ? `${p.latencyP50Ms} ms` : "–"}</Td>
                <Td align="right">{`${p.errorRatePct}%`}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    </Card>
  );
}

function Alerts() {
  return (
    <Card title={copy.alerts} description={copy.alertsSub} className="lg:col-span-2">
      <ul className="divide-y divide-app-border">
        {alerts.map((a) => (
          <li key={a.id} className="px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <Badge tone={a.tone}>{a.label}</Badge>
              <time dateTime={a.at} className="font-mono text-app-small text-app-text-3 tabular-nums">{formatUtc(a.at)}</time>
            </div>
            <p className="mt-2 text-app-ui text-app-text">{a.title}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function OverviewView() {
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="space-y-6">
        <StatSummary stats={stats} label={copy.summary} />
        <div className="grid gap-6 lg:grid-cols-5">
          <ProviderStatus />
          <Alerts />
        </div>
      </div>
    </>
  );
}
