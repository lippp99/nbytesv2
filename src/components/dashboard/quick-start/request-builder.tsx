"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { CodePane } from "@/components/dashboard/shared/code-pane";
import { ProviderLogo } from "@/components/provider-logo";
import { BASE_URL, modelById } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { type SnippetLang, buildSnippet, snippetLangs } from "@/components/dashboard/shared/build-snippet";
import { quickStartCopy } from "./quick-start-copy";

const copy = quickStartCopy.builder;
const pickModels = ["gpt-5", "claude-sonnet-4.5", "gemini-2.5-pro", "deepseek-v3.2"];
const chip =
  `inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors duration-150 ${focusRing} ` +
  "aria-pressed:border-accent-mark aria-pressed:bg-accent-soft aria-pressed:text-foreground";
const langButton =
  `h-8 rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors ${focusRing} ` +
  "hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm";

/** Pick a model and a language; the request below updates and can be copied as is. */
export function RequestBuilder() {
  const [modelId, setModelId] = useState(pickModels[0]);
  const [lang, setLang] = useState<SnippetLang>("curl");
  const model = modelById(modelId);
  const code = buildSnippet(lang, modelId, BASE_URL);
  const file = snippetLangs.find((l) => l.lang === lang)?.file;

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div role="group" aria-label={copy.model} className="flex flex-wrap gap-2">
          {pickModels.map((id) => {
            const m = modelById(id);
            return m ? (
              <button key={id} type="button" aria-pressed={id === modelId} onClick={() => setModelId(id)}
                className={cn(chip, "border-border text-muted-foreground hover:text-foreground")}>
                <ProviderLogo icon={m.icon} className="size-4" />
                {m.name}
              </button>
            ) : null;
          })}
        </div>
        <div role="group" aria-label={copy.language} className="flex rounded-full bg-muted p-1">
          {snippetLangs.map((l) => (
            <button key={l.lang} type="button" aria-pressed={l.lang === lang} onClick={() => setLang(l.lang)} className={langButton}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <CodePane title={file} code={code} lineNumbers className="rounded-none" />
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        {model && (
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">{model.name}</span> ·{" "}
            <span className="font-mono">{formatMicros(model.inputPerMTokMicros)}</span> {copy.input} ·{" "}
            <span className="font-mono">{formatMicros(model.outputPerMTokMicros)}</span> {copy.output} {copy.pricing}
          </p>
        )}
        <Link href="/playground" className={`group inline-flex items-center gap-1 rounded-sm font-medium text-accent-ink ${focusRing}`}>
          {copy.tryIt}
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
