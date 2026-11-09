"use client";

import { useState } from "react";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { mockModels } from "@/lib/model-catalog";
import { applyMarkup } from "./margin-math";
import { MarginExample } from "./margin-example";
import { MarginRules } from "./margin-rules";
import { modelsCopy as copy } from "./models-copy";
import { defaultTopUpFeeBp, upstreamCosts } from "./models-data";
import { type PricedModel, PricingTable } from "./pricing-table";

function Sources() {
  return (
    <Card title={copy.sources.title}>
      <dl className="divide-y divide-app-border">
        {copy.sources.items.map((s) => (
          <div key={s.name} className="px-6 py-3.5">
            <dt className="text-app-ui font-medium text-app-text">{s.name}</dt>
            <dd className="mt-0.5 text-app-small text-app-text-2">{s.body}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-app-border bg-app-inset px-6 py-3 text-app-small text-app-text-2">{copy.sources.note}</p>
    </Card>
  );
}

export function ModelsView() {
  const [markups, setMarkups] = useState<Record<string, number>>({});
  const [disabled, setDisabled] = useState<Set<string>>(() => new Set(["grok-4"]));
  const [topUpFeeBp, setTopUpFeeBp] = useState(defaultTopUpFeeBp);

  // Models without an upstream cost are left out: they cannot be priced. Without a set markup, the catalog price holds.
  const rows: PricedModel[] = mockModels.flatMap((model) => {
    const cost = upstreamCosts.find((c) => c.modelId === model.id);
    if (!cost) return [];
    const bp = markups[model.id];
    const custom = bp !== undefined;
    return [{ model, cost, custom, off: disabled.has(model.id),
      sellIn: custom ? applyMarkup(cost.inMicros, bp) : model.inputPerMTokMicros,
      sellOut: custom ? applyMarkup(cost.outMicros, bp) : model.outputPerMTokMicros }];
  });

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
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MarginRules modelCount={rows.length} topUpFeeBp={topUpFeeBp} onTopUpFee={setTopUpFeeBp}
              onApplyAll={(bp) => setMarkups(Object.fromEntries(rows.map((r) => [r.model.id, bp])))} />
          </div>
          <div className="lg:col-span-2"><Sources /></div>
        </div>
        <PricingTable rows={rows} onToggle={toggle} onMarkup={(id, bp) => setMarkups((m) => ({ ...m, [id]: bp }))} />
        <MarginExample rows={rows} topUpFeeBp={topUpFeeBp} />
      </div>
      <p className="mt-3 text-app-small text-app-text-3">{copy.note}</p>
    </>
  );
}
