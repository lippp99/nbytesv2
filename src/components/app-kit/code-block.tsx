import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
// Same words as dashboard/shared/common-copy.ts; the kit cannot import a feature folder.
const common = { copy: "Salin", copied: "Tersalin" };

type CodeBlockProps = { title?: string; code: string; lineNumbers?: boolean; wrap?: boolean; className?: string };

/**
 * Code that follows the theme: inset well with a hairline border, never a dark island in light mode. `wrap` breaks
 * long lines instead of scrolling sideways; use it whenever the block is narrower than its longest line.
 */
export function CodeBlock({ title, code, lineNumbers, wrap, className }: CodeBlockProps) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-app-code border border-app-border bg-app-inset", className)}>
      <div className="flex h-10 items-center justify-between border-b border-app-border pr-1 pl-4">
        <span className="truncate font-mono text-app-small text-app-text-2">{title}</span>
        <CopyButton text={code} label={common.copy} copiedLabel={common.copied} />
      </div>
      <pre className={cn("py-4 font-mono text-app-code text-app-text", wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto")}>
        <code className="grid">
          {code.split("\n").map((line, i) => (
            <span key={i} className={cn("flex pr-4", !lineNumbers && "pl-4")}>
              {lineNumbers && <span aria-hidden className="w-10 shrink-0 pr-4 text-right text-app-text-3 select-none">{i + 1}</span>}
              <span className="min-w-0">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
