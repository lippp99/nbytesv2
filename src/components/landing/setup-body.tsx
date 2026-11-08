import type { CSSProperties } from "react";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import type { Setup } from "./agents-data";
import { type Tone, tokenize } from "./code-tokens";
import { agents as copy } from "./landing-copy";

const tone: Record<Tone, string> = { "": "", key: "text-code-key", str: "text-code-string", num: "text-code-num", fn: "text-code-fn" };
// each line types itself out shortly after the one above (jatevo: .l.tw, steps(26), --d = 0.08s + i * 0.05s)
const fieldRow =
  "grid animate-type-line grid-cols-kv items-center gap-2.5 border-b border-dashed border-foreground/15 px-3 py-2 font-mono text-code last:border-b-0";
const typed = (i: number, step: number) => ({ "--i": 0, "--delay": `${80 + i * step}ms` }) as CSSProperties;

/** The setup as numbered, highlighted code lines, or as label/value rows for tools configured in a form. */
export function SetupBody({ setup }: { setup: Setup }) {
  if (setup.pairs) return <SetupFields pairs={setup.pairs} />;
  return (
    <pre className="overflow-x-auto py-3 font-mono text-code">
      <code className="block">
        {(setup.text ?? "").split("\n").map((line, i) => (
          <span key={i} style={typed(i, 50)} className="relative block animate-type-line whitespace-pre pr-3.5 pl-11.5">
            <span aria-hidden className="absolute left-0 w-7.5 text-right text-faint select-none">{i + 1}</span>
            {line ? tokenize(line, setup.lang).map(([t, text], j) => (t ? <span key={j} className={tone[t]}>{text}</span> : text)) : " "}
          </span>
        ))}
      </code>
    </pre>
  );
}

function SetupFields({ pairs }: { pairs: [string, string][] }) {
  return (
    <div className="grid py-1.5">
      {pairs.map(([k, v], i) => {
        const copyable = k === "Base URL" || k === "Model ID";
        return (
          <div key={k} style={typed(i, 70)}
            className={fieldRow}>
            <span className="font-sans text-xs text-muted-foreground">{k}</span>
            <span className={cn("break-all", copyable && "text-code-string")}>{v}</span>
            {copyable ? <CopyButton text={v} label={copy.copy} copiedLabel={copy.copied} iconOnly /> : <span />}
          </div>
        );
      })}
    </div>
  );
}
