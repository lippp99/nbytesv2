"use client";

import { Card } from "@/components/app-kit/card";
import { Field, Select, TextArea, describedBy } from "@/components/app-kit/field";
import type { CatalogModel } from "@/lib/gateway/catalog-contract";
import { formatContext } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { playground } from "./playground-copy";
import { type Settings, maxOutputOf } from "./use-playground";

const copy = playground.settings;
const range = "h-2 w-full cursor-pointer accent-app-accent";
const valueTag = "font-mono text-app-small text-app-text-2 tabular-nums";

/** Context, maximum output and sell prices of the chosen model; no provider, the catalog does not store it (D2). */
function ModelFacts({ model }: { model: CatalogModel }) {
  const facts = [
    model.contextLength !== null && `${formatContext(model.contextLength)} ${playground.context}`,
    model.maxCompletionTokens !== null && `${formatContext(model.maxCompletionTokens)} ${playground.maxOutput}`,
  ].filter(Boolean);
  return (
    <div className="mt-2 rounded-app-control border border-app-border bg-app-inset px-3 py-2.5 text-app-small leading-relaxed">
      {facts.length > 0 && <p className="text-app-text">{facts.join(" · ")}</p>}
      <p className="text-app-text-2">
        <span className="font-mono tabular-nums">{formatMicros(model.inputMicros)}</span> {copy.input.toLowerCase()} ·{" "}
        <span className="font-mono tabular-nums">{formatMicros(model.outputMicros)}</span> {copy.output.toLowerCase()} / 1M
      </p>
    </div>
  );
}

type SettingsPanelProps = {
  models: CatalogModel[];
  model: CatalogModel | undefined;
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
};

/** Right column: the parameters that shape the next request. The request itself lives in the work area's Code view. */
export function SettingsPanel({ models, model, settings, update }: SettingsPanelProps) {
  const maxTokensHint = copy.maxTokensHint(maxOutputOf(model).toLocaleString("en-US"));
  return (
    <Card title={copy.title} description={copy.description}>
      <div className="space-y-6 p-6">
        <Field id="pg-model" label={copy.model}>
          <Select id="pg-model" value={settings.modelId} disabled={!models.length} onChange={(e) => update("modelId", e.target.value)}>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          {model && <ModelFacts model={model} />}
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
        <Field id="pg-max" label={copy.maxTokens} hint={maxTokensHint}
          aside={<output htmlFor="pg-max" className={valueTag}>{settings.maxTokens.toLocaleString("en-US")}</output>}>
          <input id="pg-max" type="range" min={64} max={maxOutputOf(model)} step={64} value={settings.maxTokens} className={range}
            aria-describedby={describedBy("pg-max", { hint: maxTokensHint })}
            onChange={(e) => update("maxTokens", Number(e.target.value))} />
        </Field>
      </div>
    </Card>
  );
}
