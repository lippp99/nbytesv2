"use client";

import { useEffect, useRef, useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { ProviderLogo } from "@/components/provider-logo";
import { formatContext } from "@/lib/model-format";
import { modelById, providerById } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { ChatComposer } from "./chat-composer";
import { ChatLog } from "./chat-log";
import { playground as copy } from "./playground-copy";
import { SettingsPanel } from "./settings-panel";
import { usePlayground } from "./use-playground";

const ghost =
  `inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-muted-foreground transition-colors hover:bg-muted ` +
  `hover:text-foreground disabled:pointer-events-none disabled:opacity-40 ${focusRing}`;
const chatPane =
  "flex min-h-140 flex-col overflow-hidden rounded-card border border-border bg-card lg:col-span-8 lg:h-176 xl:col-span-9";

/** Two-pane workbench: the conversation on the left, request parameters and code on the right. */
export function PlaygroundView() {
  const pg = usePlayground();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const model = modelById(pg.settings.modelId);

  // Keep the newest turn (or the waiting skeleton) in view.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [pg.turns.length, pg.pending]);

  function send() {
    if (!draft.trim() || pg.pending) return;
    pg.send(draft);
    setDraft("");
  }

  function suggest(text: string) {
    setDraft(text);
    inputRef.current?.focus();
  }

  return (
    <>
      <div className="max-w-prose">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.sub}</p>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <section aria-label={copy.title} className={chatPane}>
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-5">
            {model && <ProviderLogo icon={model.icon} className="size-4 shrink-0" />}
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium">{model?.name}</span>
              <span className="hidden text-muted-foreground sm:inline">
                {" "}· {model && providerById(model.providerId)?.name} · {model && formatContext(model.contextTokens)} {copy.context}
              </span>
            </p>
            <p className="ml-auto shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
              {copy.session} {pg.totals.tokens.toLocaleString("en-US")} tok · {formatMicros(pg.totals.costMicros)}
            </p>
            <button type="button" onClick={pg.clear} disabled={pg.turns.length === 0 && !pg.pending} className={ghost}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden className="size-3.5" />
              <span className="hidden sm:inline">{copy.clear}</span>
            </button>
          </header>
          <div ref={logRef} className="flex-1 overflow-y-auto overscroll-contain">
            <ChatLog turns={pg.turns} pending={pg.pending} modelId={pg.settings.modelId} onSuggest={suggest} />
          </div>
          <ChatComposer draft={draft} pending={pg.pending} inputRef={inputRef} onDraftChange={setDraft} onSend={send} onStop={pg.stop} />
        </section>
        <aside className="rounded-card border border-border bg-card lg:col-span-4 lg:h-176 lg:overflow-y-auto xl:col-span-3">
          <SettingsPanel settings={pg.settings} update={pg.update} history={pg.history} />
        </aside>
      </div>
    </>
  );
}
