"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type SnippetLang, buildSnippet, snippetLangs } from "@/components/dashboard/shared/build-snippet";
import { ghostAction } from "@/components/app-kit/button";
import { CodeBlock } from "@/components/app-kit/code-block";
import { Segmented } from "@/components/app-kit/segmented";
import { ProviderLogo } from "@/components/provider-logo";
import { BASE_URL, modelById } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { quickStartCopy } from "./quick-start-copy";

const copy = quickStartCopy.builder;
const pickModels = ["gpt-5", "claude-sonnet-4.5", "gemini-2.5-pro", "deepseek-v3.2"];
const modelOptions = pickModels.flatMap((id) => {
  const m = modelById(id);
  return m ? [{ value: id, label: <span className="inline-flex items-center gap-2"><ProviderLogo icon={m.icon} className="size-3.5" />{m.name}</span> }] : [];
});
const langOptions = snippetLangs.map((l) => ({ value: l.lang, label: l.label }));

/** Pick a model and a language; the request below updates and can be copied as is. */
export function RequestBuilder() {
  const [modelId, setModelId] = useState(pickModels[0]);
  const [lang, setLang] = useState<SnippetLang>("curl");
  const model = modelById(modelId);
  const file = snippetLangs.find((l) => l.lang === lang)?.file;

  return (
    <div className="overflow-hidden rounded-app-card border border-app-border bg-app-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <Segmented label={copy.model} options={modelOptions} value={modelId} onChange={setModelId} className="flex-wrap" />
        <Segmented label={copy.language} options={langOptions} value={lang} onChange={setLang} />
      </div>
      <CodeBlock title={file} code={buildSnippet(lang, modelId, BASE_URL)} lineNumbers className="rounded-none border-x-0" />
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        {model && (
          <p className="text-app-small text-app-text-2">
            <span className="font-medium text-app-text">{model.name}</span> ·{" "}
            <span className="font-mono tabular-nums">{formatMicros(model.inputPerMTokMicros)}</span> {copy.input} ·{" "}
            <span className="font-mono tabular-nums">{formatMicros(model.outputPerMTokMicros)}</span> {copy.output} {copy.pricing}
          </p>
        )}
        <Link href="/playground" className={ghostAction("-mr-2", "sm")}>
          {copy.tryIt}
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
