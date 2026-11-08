import type { FormEvent, RefObject } from "react";
import { SentIcon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { playground as copy } from "./playground-copy";
import { estimateTokens } from "./playground-cost";
import { primaryAction, secondaryAction } from "@/components/dashboard/shared/dashboard-buttons";

type ChatComposerProps = {
  draft: string;
  pending: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
};

const frame =
  "rounded-panel border border-input bg-background transition-colors focus-within:border-foreground " +
  "focus-within:ring-2 focus-within:ring-accent-mark";
const kbd = "rounded-sm border border-border bg-background px-1 font-mono text-xs text-foreground";

/** One framed box: the message field, keyboard hints and the token estimate, with Send (or Stop while waiting). */
export function ChatComposer({ draft, pending, inputRef, onDraftChange, onSend, onStop }: ChatComposerProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSend();
  }

  return (
    <form onSubmit={submit} className="border-t border-border p-3 sm:p-4">
      <div className={frame}>
        <label htmlFor="pg-message" className="sr-only">{copy.composer.label}</label>
        <textarea
          ref={inputRef}
          id="pg-message"
          rows={3}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }}
          placeholder={copy.composer.placeholder}
          className="block max-h-60 w-full resize-none bg-transparent px-4 pt-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-3 px-3 pt-1 pb-3">
          <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <kbd className={kbd}>Enter</kbd> {copy.composer.hintSend}
            <span aria-hidden className="mx-1 text-faint">·</span>
            <kbd className={kbd}>Shift</kbd>+<kbd className={kbd}>Enter</kbd> {copy.composer.hintNewline}
          </p>
          <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
            ~{estimateTokens(draft)} {copy.composer.estimate}
          </span>
          {pending ? (
            <button type="button" onClick={onStop} className={secondaryAction("h-9 rounded-full px-4")}>
              <HugeiconsIcon icon={StopIcon} aria-hidden />
              {copy.composer.stop}
            </button>
          ) : (
            <button type="submit" disabled={!draft.trim()} className={primaryAction("h-9 rounded-full px-4")}>
              {copy.composer.send}
              <HugeiconsIcon icon={SentIcon} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
