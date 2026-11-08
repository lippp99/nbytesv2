"use client";

import { useState } from "react";
import { focusRing } from "@/components/button-styles";
import { type SnippetLang, buildSnippet, snippetLangs } from "@/components/dashboard/shared/build-snippet";
import { CodePane } from "@/components/dashboard/shared/code-pane";
import { BASE_URL } from "@/lib/model-catalog";

const langButton =
  `h-7 rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors ${focusRing} ` +
  "hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm";

/** The chat request in the reader's language; the choice only swaps the code below. */
export function RequestExample({ label }: { label: string }) {
  const [lang, setLang] = useState<SnippetLang>("curl");
  const file = snippetLangs.find((l) => l.lang === lang)?.file;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <div role="group" aria-label={label} className="flex rounded-full bg-muted p-0.5">
          {snippetLangs.map((l) => (
            <button key={l.lang} type="button" aria-pressed={l.lang === lang} onClick={() => setLang(l.lang)} className={langButton}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <CodePane title={file} code={buildSnippet(lang, "gpt-5", BASE_URL)} />
    </div>
  );
}
