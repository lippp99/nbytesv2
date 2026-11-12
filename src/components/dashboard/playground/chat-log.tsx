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
const userAvatar = "grid size-7 shrink-0 place-items-center rounded-full bg-app-text text-app-small font-medium text-app-surface";
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
    <div role="status" className="mx-auto flex max-w-3xl gap-4 px-6 py-5">
      <span aria-hidden className={modelAvatar}>{modelName.charAt(0)}</span>
      <div className="flex-1 space-y-2 pt-1.5">
        <span className="sr-only">{modelName} {copy.thinking}</span>
        <span aria-hidden className={`${pulse} w-3/4`} />
        <span aria-hidden className={`${pulse} w-1/2`} />
      </div>
    </div>
  );
}

function TurnRow({ turn, initials, modelName }: { turn: Turn; initials: string; modelName: string }) {
  const user = turn.role === "user";
  return (
    <article className={user ? "bg-app-inset" : undefined}>
      <div className="mx-auto flex max-w-3xl gap-4 px-6 py-5">
        <span aria-hidden className={user ? userAvatar : modelAvatar}>{user ? initials : modelName.charAt(0)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-app-ui font-medium text-app-text">{user ? copy.you : modelName}</p>
          <p className="mt-1 text-app-body whitespace-pre-wrap text-app-text">{turn.content}</p>
          {!user && <TurnFooter turn={turn} />}
        </div>
      </div>
    </article>
  );
}

type ChatLogProps = {
  turns: Turn[]; initials: string; modelName: (id: string | undefined) => string; currentModel: string;
  onSuggest: (text: string) => void;
};

/** Console-style transcript: full-width rows, user turns on the inset tone, usage under every reply. */
export function ChatLog({ turns, initials, modelName, currentModel, onSuggest }: ChatLogProps) {
  if (turns.length === 0) return <EmptyState modelName={currentModel} onSuggest={onSuggest} />;
  return (
    <div aria-live="polite" className="divide-y divide-app-border">
      {turns.map((turn) => (turn.status === "streaming" && !turn.content
        ? <PendingRow key={turn.id} modelName={modelName(turn.modelId)} />
        : <TurnRow key={turn.id} turn={turn} initials={initials} modelName={modelName(turn.modelId)} />))}
    </div>
  );
}
