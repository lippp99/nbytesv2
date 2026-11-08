import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { common } from "./common-copy";

type CodePaneProps = { title?: string; code: string; lineNumbers?: boolean; className?: string };

/** Dark editor-like pane in both themes (scoped `dark` tokens), with a copy button and optional line numbers. */
export function CodePane({ title, code, lineNumbers, className }: CodePaneProps) {
  return (
    <div className={cn("dark overflow-hidden rounded-panel bg-ink-panel text-foreground", className)}>
      <div className="flex h-10 items-center justify-between border-b border-border pr-1 pl-4">
        <span className="font-mono text-label text-muted-foreground">{title}</span>
        <CopyButton text={code} label={common.copy} copiedLabel={common.copied} />
      </div>
      <pre className="overflow-x-auto py-4 font-mono text-code">
        <code className="grid">
          {code.split("\n").map((line, i) => (
            <span key={i} className={cn("flex pr-4", !lineNumbers && "pl-4")}>
              {lineNumbers && <span aria-hidden className="w-10 shrink-0 pr-4 text-right text-faint select-none">{i + 1}</span>}
              <span>{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
