import { ArrowUpRight01Icon, CommandLineIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyButton } from "@/components/copy-button";
import { common } from "@/components/dashboard/shared/common-copy";
import { appFocus } from "@/components/app-kit/button";
import { formatMicros } from "@/lib/price-format";
import { playground as copy } from "./playground-copy";
import type { Turn } from "./use-playground";

const suggestion =
  "group flex w-full items-center gap-3 rounded-app-control border border-app-border bg-app-surface px-4 py-3 text-left " +
  `text-app-ui text-app-text transition-colors hover:border-app-border-strong hover:bg-app-hover ${appFocus}`;
const suggestionIcon =
  "size-4 shrink-0 text-app-text-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5";
// No provider logos (the catalog has none, D2): the model's first letter in a neutral tile.
const modelAvatar =
  "grid size-7 shrink-0 place-items-center rounded-app-inner border border-app-border bg-app-surface text-app-small font-medium text-app-text-2";
const pulse = "block h-3 animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";

function EmptyState({ modelName, onSuggest }: { modelName: string; onSuggest: (text: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center px-6 py-10">
      {/* Neutral tile: accent is for actions and selection, not decoration (D1). */}
      <span aria-hidden className="grid size-10 place-items-center rounded-app-control bg-app-inset text-app-text-2">
        <HugeiconsIcon icon={CommandLineIcon} className="size-5" />
      </span>
      <h2 className="mt-5 text-app-section text-balance text-app-text">{copy.empty.title(modelName)}</h2>
      <p className="mt-2 text-app-ui text-app-text-2">{copy.empty.body}</p>
      <ul className="mt-6 space-y-2">
        {copy.empty.suggestions.map((text) => (
          <li key={text}>
            <button type="button" onClick={() => onSuggest(text)} className={suggestion}>
              <span className="flex-1">{text}</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden className={suggestionIcon} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tokens and cost when the answer reported usage; otherwise what happened to it (D6). */
function TurnFooter({ turn }: { turn: Turn }) {
  if (turn.status === "streaming") return null;
  const note = turn.status === "stopped" ? copy.status.stopped : turn.status === "cut" ? copy.status.cut : null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 font-mono text-app-small text-app-text-3 tabular-nums">
      {turn.usage && turn.status === "done" ? (
        <>
          <span>{turn.usage.input} {copy.usage.input}</span>
          <span>{turn.usage.output} {copy.usage.output}</span>
          <span>{formatMicros(turn.usage.costMicros)}</span>
        </>
      ) : <span className="font-sans">{note ?? copy.status.costLater}</span>}
      {turn.content && <CopyButton text={turn.content} label={common.copy} copiedLabel={common.copied} iconOnly className="-ml-1" />}
    </div>
  );
}

function PendingRow({ modelName }: { modelName: string }) {
  return (
    <div role="status" className="flex gap-4">
      <span aria-hidden className={modelAvatar}>{modelName.charAt(0)}</span>
      <div className="flex-1 space-y-2 pt-1.5">
        <span className="sr-only">{modelName} {copy.thinking}</span>
        <span aria-hidden className={`${pulse} w-3/4`} />
        <span aria-hidden className={`${pulse} w-1/2`} />
      </div>
    </div>
  );
}

/** The user's message as a bubble on the right (design B); the label stays for screen readers. */
function UserTurn({ turn }: { turn: Turn }) {
  return (
    <article className="flex justify-end">
      <div className="max-w-xl rounded-app-card border border-app-border bg-app-inset px-4 py-3">
        <p className="sr-only">{copy.you}</p>
        <p className="text-app-body whitespace-pre-wrap text-app-text">{turn.content}</p>
      </div>
    </article>
  );
}

function ReplyTurn({ turn, modelName }: { turn: Turn; modelName: string }) {
  return (
    <article className="flex gap-4">
      <span aria-hidden className={modelAvatar}>{modelName.charAt(0)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-app-ui font-medium text-app-text">{modelName}</p>
        <p className="mt-1 text-app-body whitespace-pre-wrap text-app-text">{turn.content}</p>
        <TurnFooter turn={turn} />
      </div>
    </article>
  );
}

type ChatLogProps = {
  turns: Turn[]; modelName: (id: string | undefined) => string; currentModel: string;
  onSuggest: (text: string) => void;
};

/** Centered transcript: user messages as bubbles on the right, replies with the model tile and usage under them. */
export function ChatLog({ turns, modelName, currentModel, onSuggest }: ChatLogProps) {
  if (turns.length === 0) return <EmptyState modelName={currentModel} onSuggest={onSuggest} />;
  return (
    <div aria-live="polite" className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-8 sm:px-6">
      {turns.map((turn) => {
        if (turn.role === "user") return <UserTurn key={turn.id} turn={turn} />;
        const name = modelName(turn.modelId);
        return turn.status === "streaming" && !turn.content
          ? <PendingRow key={turn.id} modelName={name} />
          : <ReplyTurn key={turn.id} turn={turn} modelName={name} />;
      })}
    </div>
  );
}
