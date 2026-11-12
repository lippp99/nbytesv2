"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { type CodeLang, type CodeToken, highlightCode } from "@/lib/code-highlight";
import { cn } from "@/lib/utils";
// Same words as dashboard/shared/common-copy.ts; the kit cannot import a feature folder.
const common = { copy: "Salin", copied: "Tersalin" };

type CodeBlockProps = {
  title?: string; code: string; lineNumbers?: boolean; wrap?: boolean; className?: string; onCopy?: () => void;
  /** Colours the code like VS Code (Light+ / Dark+); without it the text stays plain (secrets, ids). */
  lang?: CodeLang;
};

/** Token lines for `code`, or null until they are ready or when `lang` is unset; plain text shows meanwhile. */
function useHighlight(code: string, lang: CodeLang | undefined): CodeToken[][] | null {
  const [result, setResult] = useState<{ code: string; lang: CodeLang; lines: CodeToken[][] } | null>(null);
  useEffect(() => {
    if (!lang) return;
    let live = true;
    highlightCode(code, lang)
      .then((lines) => live && setResult({ code, lang, lines }))
      // Colours are an extra: on failure the block stays plain, readable and copyable.
      .catch((error: unknown) => console.error("Code highlighting failed", error));
    return () => {
      live = false;
    };
  }, [code, lang]);
  // Never show colours of a previous code or language while the new ones load.
  return result && result.code === code && result.lang === lang ? result.lines : null;
}

function Token({ token }: { token: CodeToken }) {
  if (!token.light && !token.dark) return token.content;
  const style = { "--code-light": token.light ?? undefined, "--code-dark": token.dark ?? undefined } as CSSProperties;
  return (
    <span style={style} className={cn(token.light && "text-(--code-light)", token.dark && "dark:text-(--code-dark)")}>
      {token.content}
    </span>
  );
}

/**
 * Code that follows the theme: inset well with a hairline border, never a dark island in light mode. `wrap` breaks
 * long lines instead of scrolling sideways; use it whenever the block is narrower than its longest line.
 */
export function CodeBlock({ title, code, lineNumbers, wrap, className, onCopy, lang }: CodeBlockProps) {
  const tokens = useHighlight(code, lang);
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-app-code border border-app-border bg-app-inset", className)}>
      <div className="flex h-10 items-center justify-between border-b border-app-border pr-1 pl-4">
        <span className="truncate font-mono text-app-small text-app-text-2">{title}</span>
        <CopyButton text={code} label={common.copy} copiedLabel={common.copied} onCopy={onCopy} />
      </div>
      <pre className={cn("py-4 font-mono text-app-code text-app-text", wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto")}>
        <code className="grid">
          {code.split("\n").map((line, i) => (
            <span key={i} className={cn("flex pr-4", !lineNumbers && "pl-4")}>
              {lineNumbers && <span aria-hidden className="w-10 shrink-0 pr-4 text-right text-app-text-3 select-none">{i + 1}</span>}
              <span className="min-w-0">
                {tokens?.[i]?.length ? tokens[i].map((t, j) => <Token key={j} token={t} />) : line || " "}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
