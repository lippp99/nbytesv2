"use client";

import { useState } from "react";
import { type SnippetLang, buildSnippet, snippetLangs } from "@/components/dashboard/shared/build-snippet";
import { CodeBlock } from "@/components/app-kit/code-block";
import { Segmented } from "@/components/app-kit/segmented";
import { BASE_URL } from "@/lib/model-catalog";

const langOptions = snippetLangs.map((l) => ({ value: l.lang, label: l.label }));

/** The chat request in the reader's language; the choice only swaps the code below. Lines wrap in the narrow column. */
export function RequestExample({ label }: { label: string }) {
  const [lang, setLang] = useState<SnippetLang>("curl");
  const file = snippetLangs.find((l) => l.lang === lang)?.file;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-app-ui font-medium text-app-text">{label}</p>
        <Segmented label={label} options={langOptions} value={lang} onChange={setLang} />
      </div>
      <CodeBlock title={file} code={buildSnippet(lang, "gpt-5", BASE_URL)} wrap />
    </div>
  );
}
