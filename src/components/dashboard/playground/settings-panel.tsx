"use client";

import { Card } from "@/components/app-kit/card";
import { Field, Select, TextArea, describedBy } from "@/components/app-kit/field";
import { ProviderLogo } from "@/components/provider-logo";
import { mockModels, modelById, providerById } from "@/lib/model-catalog";
import { formatContext } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { playground } from "./playground-copy";
import type { Settings } from "./use-playground";

const copy = playground.settings;
const range = "h-2 w-full cursor-pointer accent-app-accent";
const valueTag = "font-mono text-app-small text-app-text-2 tabular-nums";

function ModelFacts({ modelId }: { modelId: string }) {
  const m = modelById(modelId);
  if (!m) return null;
  return (
    <div className="mt-2 flex items-center gap-3 rounded-app-control border border-app-border bg-app-inset px-3 py-2.5">
      <ProviderLogo icon={m.icon} className="size-4 shrink-0" />
      <div className="min-w-0 flex-1 text-app-small leading-relaxed">
        <p className="truncate text-app-text">{providerById(m.providerId)?.name} · {formatContext(m.contextTokens)} {playground.context}</p>
        <p className="text-app-text-2">
          <span className="font-mono tabular-nums">{formatMicros(m.inputPerMTokMicros)}</span> {copy.input.toLowerCase()} ·{" "}
          <span className="font-mono tabular-nums">{formatMicros(m.outputPerMTokMicros)}</span> {copy.output.toLowerCase()} / 1M
        </p>
      </div>
    </div>
  );
}

type SettingsPanelProps = { settings: Settings; update: <K extends keyof Settings>(key: K, value: Settings[K]) => void };

/** Right column: the parameters that shape the next request. The request itself lives in the work area's Code view. */
export function SettingsPanel({ settings, update }: SettingsPanelProps) {
  return (
    <Card title={copy.title} description={copy.description}>
      <div className="space-y-6 p-6">
        <Field id="pg-model" label={copy.model}>
          <Select id="pg-model" value={settings.modelId} onChange={(e) => update("modelId", e.target.value)}>
            {mockModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <ModelFacts modelId={settings.modelId} />
        </Field>
        <Field id="pg-system" label={copy.system}>
          <TextArea id="pg-system" rows={4} value={settings.system} placeholder={copy.systemPlaceholder}
            onChange={(e) => update("system", e.target.value)} />
        </Field>
        <Field id="pg-temp" label={copy.temperature} hint={copy.temperatureHint}
          aside={<output htmlFor="pg-temp" className={valueTag}>{settings.temperature.toFixed(1)}</output>}>
          <input id="pg-temp" type="range" min={0} max={2} step={0.1} value={settings.temperature} className={range}
            aria-describedby={describedBy("pg-temp", { hint: copy.temperatureHint })}
            onChange={(e) => update("temperature", Number(e.target.value))} />
        </Field>
        <Field id="pg-max" label={copy.maxTokens} hint={copy.maxTokensHint}
          aside={<output htmlFor="pg-max" className={valueTag}>{settings.maxTokens.toLocaleString("en-US")}</output>}>
          <input id="pg-max" type="range" min={64} max={4096} step={64} value={settings.maxTokens} className={range}
            aria-describedby={describedBy("pg-max", { hint: copy.maxTokensHint })}
            onChange={(e) => update("maxTokens", Number(e.target.value))} />
        </Field>
      </div>
    </Card>
  );
}
