import { ArrowUpRight01Icon, CommandLineIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { CopyButton } from "@/components/copy-button";
import { common } from "@/components/dashboard/shared/common-copy";
import { account } from "@/components/dashboard/shared/dashboard-data";
import { ProviderLogo } from "@/components/provider-logo";
import { modelById } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { playground as copy } from "./playground-copy";
import type { Turn } from "./use-playground";

const initials = account.userName.split(" ").map((p) => p[0]).slice(0, 2).join("");
const suggestion =
  `group flex w-full items-center gap-3 rounded-panel border border-border px-4 py-3 text-left text-sm transition-colors ` +
  `hover:border-foreground/20 hover:bg-muted ${focusRing}`;
const suggestionIcon =
  "size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5";
const userAvatar = "grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-xs font-medium text-background";

function EmptyState({ modelName, onSuggest }: { modelName: string; onSuggest: (text: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center px-5 py-10">
      <span aria-hidden className="grid size-11 place-items-center rounded-panel bg-accent-soft text-accent-ink">
        <HugeiconsIcon icon={CommandLineIcon} className="size-5" />
      </span>
      <h2 className="mt-5 text-lg font-semibold tracking-tight text-balance">{copy.empty.title(modelName)}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{copy.empty.body}</p>
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

function Avatar({ turn }: { turn: Turn }) {
  const model = turn.modelId ? modelById(turn.modelId) : undefined;
  if (turn.role === "user") {
    return <span aria-hidden className={userAvatar}>{initials}</span>;
  }
  return (
    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-chip border border-border bg-background">
      {model && <ProviderLogo icon={model.icon} className="size-3.5" />}
    </span>
  );
}

function TurnRow({ turn }: { turn: Turn }) {
  const name = turn.role === "user" ? copy.you : (modelById(turn.modelId ?? "")?.name ?? "");
  return (
    <article className={turn.role === "user" ? "bg-muted/50" : undefined}>
      <div className="mx-auto flex max-w-3xl gap-4 px-5 py-5">
        <Avatar turn={turn} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{name}</p>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{turn.content}</p>
          {turn.usage && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 font-mono text-xs text-muted-foreground tabular-nums">
              <span>{turn.usage.input} {copy.usage.input}</span>
              <span>{turn.usage.output} {copy.usage.output}</span>
              <span>{formatMicros(turn.usage.costMicros)}</span>
              <CopyButton text={turn.content} label={common.copy} copiedLabel={common.copied} iconOnly className="-ml-1" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function PendingRow({ modelId }: { modelId: string }) {
  const model = modelById(modelId);
  return (
    <div role="status" className="mx-auto flex max-w-3xl gap-4 px-5 py-5">
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-chip border border-border">
        {model && <ProviderLogo icon={model.icon} className="size-3.5" />}
      </span>
      <div className="flex-1 space-y-2 pt-1.5">
        <span className="sr-only">{model?.name} {copy.thinking}</span>
        <span aria-hidden className="block h-3 w-3/4 animate-pulse rounded-full bg-muted" />
        <span aria-hidden className="block h-3 w-1/2 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

type ChatLogProps = { turns: Turn[]; pending: boolean; modelId: string; onSuggest: (text: string) => void };

/** Console-style transcript: full-width rows, user turns on a faint plate, usage under every reply. */
export function ChatLog({ turns, pending, modelId, onSuggest }: ChatLogProps) {
  if (turns.length === 0 && !pending) return <EmptyState modelName={modelById(modelId)?.name ?? ""} onSuggest={onSuggest} />;
  return (
    <div aria-live="polite" className="divide-y divide-border">
      {turns.map((turn) => <TurnRow key={turn.id} turn={turn} />)}
      {pending && <PendingRow modelId={modelId} />}
    </div>
  );
}
