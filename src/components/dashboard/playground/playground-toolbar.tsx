"use client";

import { useState } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ghostAction, secondaryAction } from "@/components/app-kit/button";
import { TextArea } from "@/components/app-kit/field";
import { TrashIcon } from "@/components/dashboard/shared/icons/trash";
import type { CatalogModel } from "@/lib/gateway/catalog-contract";
import { formatContext } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { NumberField } from "./number-field";
import { playground } from "./playground-copy";
import { type Settings, maxOutputOf } from "./use-playground";

const copy = playground.settings;
const modelFrame =
  "relative flex h-10 min-w-0 items-center gap-2 rounded-app-control border border-app-border-strong bg-app-surface pl-3 " +
  "transition-[border-color,box-shadow] duration-150 focus-within:border-app-accent focus-within:ring-3 " +
  "focus-within:ring-app-accent/20 max-sm:w-full";

/** Context and sell prices of the chosen model, in one line; no provider, the catalog does not store it (D2). */
function ModelFacts({ model }: { model: CatalogModel }) {
  const context = model.contextLength !== null ? `${formatContext(model.contextLength)} ${playground.context} · ` : "";
  return (
    <p className="ml-auto hidden text-app-small text-app-text-3 tabular-nums xl:block">
      {context}{formatMicros(model.inputMicros)} / {formatMicros(model.outputMicros)} {copy.perMillion}
    </p>
  );
}

type PlaygroundToolbarProps = {
  models: CatalogModel[];
  model: CatalogModel | undefined;
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  canClear: boolean;
  onClear: () => void;
};

/** Parameters of the next request in one row above the transcript; the system prompt opens in a row of its own. */
export function PlaygroundToolbar({ models, model, settings, update, canClear, onClear }: PlaygroundToolbarProps) {
  const [systemOpen, setSystemOpen] = useState(false);
  const maxTokens = maxOutputOf(model);
  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-app-border bg-app-inset px-4 py-3">
        <div className={modelFrame}>
          <label htmlFor="pg-model" className="text-app-small text-app-text-2">{copy.model}</label>
          <select id="pg-model" value={settings.modelId} disabled={!models.length} onChange={(e) => update("modelId", e.target.value)}
            className="h-full min-w-0 flex-1 appearance-none truncate bg-transparent pr-9 text-app-ui text-app-text outline-none sm:max-w-56">
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden className="pointer-events-none absolute right-3 size-4 text-app-text-3" />
        </div>
        <NumberField id="pg-temp" label={copy.temperature} hint={copy.temperatureHint} value={settings.temperature}
          min={0} max={2} step={0.1} decimals={1} onChange={(v) => update("temperature", v)} />
        <NumberField id="pg-max" label={copy.maxTokens} hint={copy.maxTokensHint(maxTokens.toLocaleString("en-US"))}
          value={settings.maxTokens} min={64} max={maxTokens} step={64} onChange={(v) => update("maxTokens", v)} />
        <button type="button" aria-expanded={systemOpen} aria-controls="pg-system-row" onClick={() => setSystemOpen((o) => !o)}
          className={secondaryAction("max-sm:w-full")}>
          {copy.system}
          {!systemOpen && settings.system.trim() && <span className="text-app-small text-app-text-3">· {copy.systemFilled}</span>}
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden className={cn("transition-transform duration-150", systemOpen && "rotate-180")} />
        </button>
        {model && <ModelFacts model={model} />}
        <button type="button" onClick={onClear} disabled={!canClear} aria-label={playground.clear} title={playground.clear}
          className={ghostAction("size-9 px-0 max-xl:ml-auto")}>
          <TrashIcon />
        </button>
      </div>
      {systemOpen && (
        <div id="pg-system-row" className="shrink-0 border-b border-app-border px-4 py-3">
          <label htmlFor="pg-system" className="sr-only">{copy.system}</label>
          <TextArea id="pg-system" rows={2} value={settings.system} placeholder={copy.systemPlaceholder} className="min-h-16"
            onChange={(e) => update("system", e.target.value)} />
        </div>
      )}
    </>
  );
}
