"use client";

import { useEffect, useState } from "react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckIcon } from "@/components/icons/ui/check";
import { CopyIcon } from "@/components/icons/ui/copy";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  text: string;
  label: string;
  copiedLabel: string;
  /** Said when the clipboard refuses; without it a refusal stays silent (the landing keeps that). */
  failedLabel?: string;
  /** Show only the icon; the label stays for screen readers. */
  iconOnly?: boolean;
  className?: string;
  /** Called after the text reached the clipboard. */
  onCopy?: () => void;
};

type Result = "copied" | "failed" | null;

export function CopyButton({ text, label, copiedLabel, failedLabel, iconOnly, className, onCopy }: CopyButtonProps) {
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => setResult(null), result === "failed" ? 4000 : 1500);
    return () => clearTimeout(id);
  }, [result]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setResult("copied");
      onCopy?.();
    } catch {
      // Clipboard can be blocked (permissions, insecure context); the text stays selectable as a fallback.
      setResult(failedLabel ? "failed" : null);
    }
  }

  const said = result === "copied" ? copiedLabel : result === "failed" ? failedLabel : "";
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex h-11 items-center gap-1.5 px-2.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground sm:h-8",
        iconOnly && "w-11 justify-center px-0 sm:w-8",
        result === "failed" && "text-destructive hover:text-destructive",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      {result === "copied" && <CheckIcon className="size-3.5 animate-dot-pop text-success" />}
      {result === "failed" && <HugeiconsIcon icon={AlertCircleIcon} aria-hidden className="size-3.5" />}
      {!result && <CopyIcon className="size-3.5" />}
      <span className={cn("grid", iconOnly && "sr-only")}>
        <span className={cn("col-start-1 row-start-1 transition-opacity duration-150", result && "opacity-0")}>{label}</span>
        <span aria-live="polite" className={cn("col-start-1 row-start-1 transition-opacity duration-150", !result && "opacity-0")}>
          {said}
        </span>
      </span>
    </button>
  );
}
