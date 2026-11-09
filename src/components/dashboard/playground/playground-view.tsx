"use client";

import { useEffect, useRef, useState } from "react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ghostAction } from "@/components/app-kit/button";
import { CodeBlock } from "@/components/app-kit/code-block";
import { PageHeader } from "@/components/app-kit/page-header";
import { Segmented } from "@/components/app-kit/segmented";
import { ProviderLogo } from "@/components/provider-logo";
import { BASE_URL, modelById } from "@/lib/model-catalog";
import { formatMicros } from "@/lib/price-format";
import { ChatComposer } from "./chat-composer";
import { ChatLog } from "./chat-log";
import { playground as copy } from "./playground-copy";
import { curlCommand, requestBody } from "./playground-request";
import { SettingsPanel } from "./settings-panel";
import { usePlayground } from "./use-playground";

type View = "chat" | "code";
const viewOptions: { value: View; label: string }[] = [
  { value: "chat", label: copy.views.chat },
  { value: "code", label: copy.views.code },
];
// Work area stays in view (spec: the playground transcript is the one box that scrolls on its own).
const workArea = "flex min-h-140 flex-col overflow-hidden rounded-app-card border border-app-border bg-app-surface lg:col-span-2 lg:h-176";

type WorkAreaHeaderProps = {
  modelId: string;
  totals: { tokens: number; costMicros: number };
  view: View;
  onView: (view: View) => void;
  canClear: boolean;
  onClear: () => void;
};

/** Model in use, what this session has cost so far, the Chat/Code switch and clear. */
function WorkAreaHeader({ modelId, totals, view, onView, canClear, onClear }: WorkAreaHeaderProps) {
  const model = modelById(modelId);
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-app-border px-4 py-2 sm:px-6">
      {model && <ProviderLogo icon={model.icon} className="size-4 shrink-0" />}
      <p className="min-w-0 truncate text-app-ui font-medium text-app-text">{model?.name}</p>
      <p className="font-mono text-app-small text-app-text-3 tabular-nums">
        {copy.session} {totals.tokens.toLocaleString("en-US")} tok · {formatMicros(totals.costMicros)}
      </p>
      <div className="ml-auto flex items-center gap-2">
        <Segmented label={copy.views.label} options={viewOptions} value={view} onChange={onView} />
        <button type="button" onClick={onClear} disabled={!canClear} aria-label={copy.clear} title={copy.clear}
          className={ghostAction("size-9 px-0")}>
          <HugeiconsIcon icon={Delete02Icon} aria-hidden />
        </button>
      </div>
    </header>
  );
}

/** Two-column workbench: the conversation (or its request as code) in the wide column, parameters on the right. */
export function PlaygroundView() {
  const pg = usePlayground();
  const [view, setView] = useState<View>("chat");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const { modelId, temperature, maxTokens } = pg.settings;
  const code = curlCommand(BASE_URL, requestBody({ model: modelId, temperature, maxTokens }, pg.history));

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
    setView("chat");
    inputRef.current?.focus();
  }

  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label={copy.title} className={workArea}>
          <WorkAreaHeader modelId={modelId} totals={pg.totals} view={view} onView={setView}
            canClear={pg.turns.length > 0 || pg.pending} onClear={pg.clear} />
          {view === "chat" ? (
            <>
              <div ref={logRef} className="flex-1 overflow-y-auto overscroll-contain">
                <ChatLog turns={pg.turns} pending={pg.pending} modelId={pg.settings.modelId} onSuggest={suggest} />
              </div>
              <ChatComposer draft={draft} pending={pg.pending} inputRef={inputRef} onDraftChange={setDraft} onSend={send} onStop={pg.stop} />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <p className="mb-4 max-w-prose text-app-ui text-app-text-2">{copy.settings.codeHint}</p>
              <CodeBlock title="request.sh" code={code} lineNumbers />
            </div>
          )}
        </section>
        <aside className="lg:self-start">
          <SettingsPanel settings={pg.settings} update={pg.update} />
        </aside>
      </div>
    </>
  );
}
