"use client";

import { useState } from "react";
import { Badge } from "@/components/app-kit/badge";
import { secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { THead, Table, Td, Th, Tr } from "@/components/app-kit/table";
import { ProviderLogo } from "@/components/provider-logo";
import { providerById } from "@/lib/model-catalog";
import { providerHealth, providerStateBadge } from "../shared/provider-health";
import { providersCopy as copy } from "./providers-copy";

export function ProvidersView() {
  const [disabled, setDisabled] = useState<Set<string>>(() => new Set(["xai"]));
  const cols = copy.cols;

  function toggle(id: string) {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <Card>
        <Table minWidth="min-w-4xl">
          <THead>
            <Th>{cols.provider}</Th>
            <Th>{cols.status}</Th>
            <Th align="right">{cols.uptime}</Th>
            <Th align="right">{cols.latency}</Th>
            <Th align="right">{cols.errors}</Th>
            <Th align="right">{cols.requests}</Th>
            <Th>{cols.routing}</Th>
          </THead>
          <tbody>
            {providerHealth.map((p) => {
              const provider = providerById(p.providerId);
              const badge = providerStateBadge[p.state];
              const off = disabled.has(p.providerId);
              const name = provider?.name ?? p.providerId;
              return (
                <Tr key={p.providerId}>
                  <Td>
                    <span className="flex items-center gap-2.5">
                      {provider && <ProviderLogo icon={provider.icon} className="size-4 shrink-0" />}
                      {name}
                    </span>
                  </Td>
                  <Td><Badge tone={badge.tone}>{badge.label}</Badge></Td>
                  <Td align="right">{`${p.uptimePct}%`}</Td>
                  <Td align="right">{p.latencyP50Ms ? `${p.latencyP50Ms} ms` : "–"}</Td>
                  <Td align="right">{`${p.errorRatePct}%`}</Td>
                  <Td align="right">{p.requests24h.toLocaleString("en-US")}</Td>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Badge tone={off ? "neutral" : "success"} className="w-22">{off ? copy.off : copy.on}</Badge>
                      <button type="button" onClick={() => toggle(p.providerId)} aria-label={`${off ? copy.enable : copy.disable} ${name}`}
                        className={secondaryAction(undefined, "sm")}>
                        {off ? copy.enable : copy.disable}
                      </button>
                    </span>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      <p className="mt-3 text-app-small text-app-text-3">{copy.note}</p>
    </>
  );
}
