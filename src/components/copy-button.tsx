"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons/ui/check";
import { CopyIcon } from "@/components/icons/ui/copy";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  text: string;
  label: string;
  copiedLabel: string;
  /** Show only the icon; the label stays for screen readers. */
  iconOnly?: boolean;
  className?: string;
};

export function CopyButton({ text, label, copiedLabel, iconOnly, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (permissions, insecure context); the text stays selectable as a fallback.
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex h-11 items-center gap-1.5 px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground sm:h-8",
        iconOnly && "w-11 justify-center px-0 sm:w-8",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      {copied ? (
        <CheckIcon className="size-3.5 animate-dot-pop text-success" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
      <span className={cn("grid", iconOnly && "sr-only")}>
        <span className={cn("col-start-1 row-start-1 transition-opacity duration-150", copied && "opacity-0")}>{label}</span>
        <span
          aria-live="polite"
          className={cn("col-start-1 row-start-1 transition-opacity duration-150", !copied && "opacity-0")}
        >
          {copied ? copiedLabel : ""}
        </span>
      </span>
    </button>
  );
}
