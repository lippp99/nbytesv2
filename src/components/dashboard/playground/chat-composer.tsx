import type { FormEvent, RefObject } from "react";
import { StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SendIcon } from "@/components/dashboard/shared/icons/send";
import { playground as copy } from "./playground-copy";
import { estimateTokens } from "./playground-request";
import { primaryAction, secondaryAction } from "@/components/app-kit/button";

type ChatComposerProps = {
  draft: string;
  pending: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  /** No model to send to (empty catalog, F10). */
  disabled: boolean;
  /** "$0.42": the most this send can hold from the balance (R2); null without a model. */
  hold: string | null;
  /** "Sesi ini 1,234 token · $0.01": what this conversation has used so far. */
  session: string;
};

const frame =
  "rounded-app-control border border-app-border-strong bg-app-surface transition-[border-color,box-shadow] duration-150 " +
  "focus-within:border-app-accent focus-within:ring-3 focus-within:ring-app-accent/20";
const kbd = "rounded-sm border border-app-border bg-app-inset px-1 font-mono text-app-small text-app-text-2";

/** One framed box: the message field, keyboard hints, session use and the token estimate, with Send (or Stop). */
export function ChatComposer({ draft, pending, inputRef, onDraftChange, onSend, onStop, disabled, hold, session }: ChatComposerProps) {
  function submit(event: FormEvent) {
    event.preventDefault();
    onSend();
  }

  return (
    <form onSubmit={submit} className="border-t border-app-border p-4 sm:px-6">
      <div className={`mx-auto max-w-3xl ${frame}`}>
        <label htmlFor="pg-message" className="sr-only">{copy.composer.label}</label>
        <textarea
          ref={inputRef}
          id="pg-message"
          rows={3}
          disabled={disabled}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }}
          placeholder={copy.composer.placeholder}
          className="block max-h-60 w-full resize-none bg-transparent px-4 pt-3 text-app-body text-app-text outline-none placeholder:text-app-text-3"
        />
        <div className="flex items-center gap-3 px-3 pt-1 pb-3">
          <p className="hidden items-center gap-1.5 text-app-small text-app-text-3 sm:flex">
            <kbd className={kbd}>Enter</kbd> {copy.composer.hintSend}
            <span aria-hidden className="mx-1">·</span>
            <kbd className={kbd}>Shift</kbd>+<kbd className={kbd}>Enter</kbd> {copy.composer.hintNewline}
          </p>
          <span className="ml-auto flex flex-wrap justify-end gap-x-3 text-app-small text-app-text-3 tabular-nums">
            <span>{session}</span>
            <span>{copy.composer.estimate(estimateTokens(draft))}</span>
            {hold && <span title={copy.composer.holdTitle}>{copy.composer.hold(hold)}</span>}
          </span>
          {pending ? (
            <button type="button" onClick={onStop} className={secondaryAction("h-9 px-4")}>
              <HugeiconsIcon icon={StopIcon} aria-hidden />
              {copy.composer.stop}
            </button>
          ) : (
            <button type="submit" disabled={disabled || !draft.trim()} className={primaryAction("h-9 px-4")}>
              {copy.composer.send}
              <SendIcon />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
