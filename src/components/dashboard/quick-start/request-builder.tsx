"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type SnippetLang, buildSnippet, snippetLangs } from "@/components/dashboard/shared/build-snippet";
import { ghostAction } from "@/components/app-kit/button";
import { CodeBlock } from "@/components/app-kit/code-block";
import { Select } from "@/components/app-kit/field";
import { Segmented } from "@/components/app-kit/segmented";
import type { CatalogModel } from "@/lib/gateway/catalog-contract";
import { formatMicros } from "@/lib/price-format";
import { quickStartCopy } from "./quick-start-copy";

const copy = quickStartCopy.builder;
const langOptions = snippetLangs.map((l) => ({ value: l.lang, label: l.label }));
/** D2: a segmented control holds a few short options; more models get a select. */
const SEGMENTED_MAX = 4;

type ModelPickerProps = { models: CatalogModel[]; value: string; onChange: (id: string) => void };

function ModelPicker({ models, value, onChange }: ModelPickerProps) {
  if (models.length > SEGMENTED_MAX) {
    return (
      <div className="w-full sm:w-56">
        <Select aria-label={copy.model} value={value} onChange={(e) => onChange(e.target.value)}>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </Select>
      </div>
    );
  }
  const options = models.map((m) => ({ value: m.id, label: m.name }));
  return <Segmented label={copy.model} options={options} value={value} onChange={onChange} className="flex-wrap" />;
}

/** Pick a model and a language; the request below updates and can be copied as is. */
export function RequestBuilder({ models, baseUrl }: { models: CatalogModel[]; baseUrl: string }) {
  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [lang, setLang] = useState<SnippetLang>("curl");
  const model = models.find((m) => m.id === modelId);
  const file = snippetLangs.find((l) => l.lang === lang)?.file;

  if (!model) {
    return <p className="rounded-app-control border border-app-border bg-app-inset px-4 py-3 text-app-ui text-app-text-2">{copy.noModels}</p>;
  }
  return (
    <div className="overflow-hidden rounded-app-card border border-app-border bg-app-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <ModelPicker models={models} value={modelId} onChange={setModelId} />
        <Segmented label={copy.language} options={langOptions} value={lang} onChange={setLang} />
      </div>
      <CodeBlock title={file} code={buildSnippet(lang, model.id, baseUrl)} lineNumbers className="rounded-none border-x-0" />
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-app-small text-app-text-2">
          <span className="font-medium text-app-text">{model.name}</span> ·{" "}
          <span className="font-mono tabular-nums">{formatMicros(model.inputMicros)}</span> {copy.input} ·{" "}
          <span className="font-mono tabular-nums">{formatMicros(model.outputMicros)}</span> {copy.output} {copy.pricing}
        </p>
        <Link href="/playground" className={ghostAction("-mr-2", "sm")}>
          {copy.tryIt}
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
