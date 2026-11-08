"use client";

import type { ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";
import { common } from "@/components/dashboard/shared/common-copy";
import { ProviderLogo } from "@/components/provider-logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BASE_URL, mockModels, modelById, providerById } from "@/lib/model-catalog";
import { formatContext } from "@/lib/model-format";
import { formatMicros } from "@/lib/price-format";
import { playground } from "./playground-copy";
import { type RequestMessage, curlCommand, requestBody } from "./playground-request";
import type { Settings } from "./use-playground";

const copy = playground.settings;
const field =
  "w-full rounded-panel border border-input bg-transparent px-3 text-sm outline-none transition-colors " +
  "focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-accent-mark";
// `!` on radii: ui/tabs merges with the bare `cn` package, which keeps its own rounded-lg/rounded-md over our tokens.
const tabList = "h-10 w-full rounded-panel! bg-muted p-1 group-data-horizontal/tabs:h-10";
const tabTrigger =
  "rounded-chip! text-sm data-active:bg-background data-active:shadow-sm dark:data-active:border-transparent " +
  "dark:data-active:bg-background";

function Field({ id, label, value, hint, children }: { id: string; label: string; value?: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        {value && <output htmlFor={id} className="font-mono text-xs text-muted-foreground tabular-nums">{value}</output>}
      </div>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ModelFacts({ modelId }: { modelId: string }) {
  const m = modelById(modelId);
  if (!m) return null;
  return (
    <div className="mt-3 flex items-center gap-3 rounded-panel bg-muted px-3 py-2.5">
      <ProviderLogo icon={m.icon} className="size-4 shrink-0" />
      <div className="min-w-0 flex-1 text-xs leading-relaxed">
        <p className="truncate text-foreground">{providerById(m.providerId)?.name} · {formatContext(m.contextTokens)} {playground.context}</p>
        <p className="text-muted-foreground">
          <span className="font-mono">{formatMicros(m.inputPerMTokMicros)}</span> {copy.input.toLowerCase()} ·{" "}
          <span className="font-mono">{formatMicros(m.outputPerMTokMicros)}</span> {copy.output.toLowerCase()} / 1M
        </p>
      </div>
    </div>
  );
}

function ParamsTab({ settings, update }: Pick<SettingsPanelProps, "settings" | "update">) {
  return (
    <div className="space-y-6">
      <Field id="pg-model" label={copy.model}>
        <select id="pg-model" value={settings.modelId} onChange={(e) => update("modelId", e.target.value)} className={`${field} h-10`}>
          {mockModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <ModelFacts modelId={settings.modelId} />
      </Field>
      <Field id="pg-system" label={copy.system}>
        <textarea id="pg-system" rows={4} value={settings.system} onChange={(e) => update("system", e.target.value)}
          placeholder={copy.systemPlaceholder} className={`${field} resize-y py-2.5 placeholder:text-muted-foreground`} />
      </Field>
      <Field id="pg-temp" label={copy.temperature} value={settings.temperature.toFixed(1)} hint={copy.temperatureHint}>
        <input id="pg-temp" type="range" min={0} max={2} step={0.1} value={settings.temperature}
          onChange={(e) => update("temperature", Number(e.target.value))} className="w-full accent-accent-mark" />
      </Field>
      <Field id="pg-max" label={copy.maxTokens} value={settings.maxTokens.toLocaleString("en-US")} hint={copy.maxTokensHint}>
        <input id="pg-max" type="range" min={64} max={4096} step={64} value={settings.maxTokens}
          onChange={(e) => update("maxTokens", Number(e.target.value))} className="w-full accent-accent-mark" />
      </Field>
    </div>
  );
}

function CodeTab({ settings, history }: Pick<SettingsPanelProps, "settings" | "history">) {
  const code = curlCommand(BASE_URL, requestBody(
    { model: settings.modelId, temperature: settings.temperature, maxTokens: settings.maxTokens }, history));
  return (
    <div>
      <p className="text-xs text-muted-foreground">{copy.codeHint}</p>
      <div className="dark mt-3 overflow-hidden rounded-panel bg-ink-panel text-foreground">
        <div className="flex h-9 items-center justify-between border-b border-border pr-1 pl-3">
          <span className="font-mono text-label text-muted-foreground">request.sh</span>
          <CopyButton text={code} label={common.copy} copiedLabel={common.copied} />
        </div>
        <pre className="max-h-120 overflow-auto p-3 font-mono text-xs leading-relaxed"><code>{code}</code></pre>
      </div>
    </div>
  );
}

type SettingsPanelProps = {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  history: RequestMessage[];
};

/** Right column: parameters that shape the next request, and that request as cURL. */
export function SettingsPanel({ settings, update, history }: SettingsPanelProps) {
  return (
    <Tabs defaultValue="params" className="gap-5 p-4 sm:p-5">
      <TabsList aria-label={copy.tabs} className={tabList}>
        <TabsTrigger value="params" className={tabTrigger}>{copy.params}</TabsTrigger>
        <TabsTrigger value="code" className={tabTrigger}>{copy.code}</TabsTrigger>
      </TabsList>
      <TabsContent value="params"><ParamsTab settings={settings} update={update} /></TabsContent>
      <TabsContent value="code"><CodeTab settings={settings} history={history} /></TabsContent>
    </Tabs>
  );
}
