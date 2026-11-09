"use client";

import { useState } from "react";
import { Card } from "@/components/app-kit/card";
import { Select } from "@/components/app-kit/field";
import { formatMicros } from "@/lib/price-format";
import { formatBp, marginBpOf, tokensMicros } from "./margin-math";
import { modelsCopy } from "./models-copy";
import { paymentFeeBp } from "./models-data";
import type { PricedModel } from "./pricing-table";

const copy = modelsCopy.example;
const IN_TOKENS = 2_000;
const OUT_TOKENS = 500;
const TOP_UP_MICROS = 100_000_000;

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-app-ui text-app-text-2">{label}</dt>
      <dd className={`font-mono text-app-code tabular-nums ${strong ? "font-semibold text-app-text" : "text-app-text"}`}>{value}</dd>
    </div>
  );
}

/** Worked numbers so the admin sees what a markup or fee change means in dollars, per request and per top-up. */
export function MarginExample({ rows, topUpFeeBp }: { rows: PricedModel[]; topUpFeeBp: number }) {
  const [id, setId] = useState("claude-sonnet-4.5");
  const row = rows.find((r) => r.model.id === id) ?? rows[0];
  const cost = tokensMicros(row.cost.inMicros, IN_TOKENS) + tokensMicros(row.cost.outMicros, OUT_TOKENS);
  const revenue = tokensMicros(row.sellIn, IN_TOKENS) + tokensMicros(row.sellOut, OUT_TOKENS);
  const fee = Math.round((TOP_UP_MICROS * topUpFeeBp) / 10_000);
  // The card processor charges on the whole amount the customer pays (top-up plus fee).
  const card = Math.round(((TOP_UP_MICROS + fee) * paymentFeeBp) / 10_000);
  const net = fee - card;

  return (
    <Card title={copy.title} description={copy.description}>
      <div className="grid gap-6 p-6 md:grid-cols-2 md:gap-10">
        <div>
          <label htmlFor="ex-model" className="text-app-ui font-medium text-app-text">{copy.model}</label>
          <div className="mt-2">
            <Select id="ex-model" value={row.model.id} onChange={(e) => setId(e.target.value)}>
              {rows.map((r) => <option key={r.model.id} value={r.model.id}>{r.model.name}</option>)}
            </Select>
          </div>
          <dl className="mt-4 divide-y divide-app-border">
            <Line label={copy.rows.cost} value={formatMicros(cost)} />
            <Line label={copy.rows.revenue} value={formatMicros(revenue)} />
            <Line label={copy.rows.profit} value={formatMicros(Math.max(0, revenue - cost))} strong />
            <Line label={copy.rows.margin} value={formatBp(marginBpOf(cost, revenue))} />
          </dl>
        </div>
        <div>
          <h3 className="text-app-card text-app-text">{copy.topUpTitle}</h3>
          <dl className="mt-4 divide-y divide-app-border">
            <Line label={`${copy.topUpRows.fee} (${formatBp(topUpFeeBp)})`} value={formatMicros(fee)} />
            <Line label={`${copy.topUpRows.card} (${formatBp(paymentFeeBp)})`} value={`−${formatMicros(card)}`} />
            <Line label={copy.topUpRows.net} value={net < 0 ? `−${formatMicros(-net)}` : formatMicros(net)} strong />
          </dl>
        </div>
      </div>
    </Card>
  );
}
