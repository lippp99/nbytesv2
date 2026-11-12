"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CubeIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { appFocus, ghostAction } from "@/components/app-kit/button";
import { CodeBlock } from "@/components/app-kit/code-block";
import { EmptyState } from "@/components/app-kit/empty-state";
import { PageHeader } from "@/components/app-kit/page-header";
import { Segmented } from "@/components/app-kit/segmented";
import type { CatalogModel } from "@/lib/gateway/catalog-contract";
import { holdMicros, outputCap } from "@/lib/gateway/price-math";
import type { PlaygroundError } from "@/lib/playground/playground-client";
import { formatMicros } from "@/lib/price-format";
import { ChatComposer } from "./chat-composer";
import { ChatLog } from "./chat-log";
import { playground as copy, playgroundErrorText } from "./playground-copy";
import { bodyBytes, curlCommand, requestBody } from "./playground-request";
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
  modelName: string; totals: { tokens: number; costMicros: number }; view: View; onView: (view: View) => void;
  canClear: boolean; onClear: () => void;
};

/** Model in use, what this session has cost so far, the Chat/Code switch and clear. */
function WorkAreaHeader({ modelName, totals, view, onView, canClear, onClear }: WorkAreaHeaderProps) {
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-app-border px-4 py-2 sm:px-6">
      <p className="min-w-0 truncate text-app-ui font-medium text-app-text">{modelName}</p>
      <p className="text-app-small text-app-text-3 tabular-nums">
        {copy.session}: {totals.tokens.toLocaleString("en-US")} {copy.tokens} · {formatMicros(totals.costMicros)}
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

/** Above the composer, with the word and a way out: a top-up link when the balance is short (D7). */
function SendError({ error }: { error: PlaygroundError }) {
  return (
    <p role="alert" className="border-t border-app-border px-6 pt-3 text-app-small text-app-danger">
      {playgroundErrorText(error)}
      {error.kind === "insufficient_balance" && (
        <Link href="/billing" className={`ml-2 font-medium text-app-accent-text underline-offset-2 hover:underline ${appFocus}`}>
          {copy.topUp}
        </Link>
      )}
    </p>
  );
}

type PlaygroundViewProps = { models: CatalogModel[]; baseUrl: string; initials: string };

/** Two-column workbench: the conversation (or its request as code) in the wide column, parameters on the right. */
export function PlaygroundView({ models, baseUrl, initials }: PlaygroundViewProps) {
  const router = useRouter();
  const pg = usePlayground(models);
  const [view, setView] = useState<View>("chat");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const { modelId, temperature, maxTokens } = pg.settings;
  const code = curlCommand(baseUrl, requestBody({ model: modelId, temperature, maxTokens }, pg.history));
  const nameOf = (id: string | undefined) => models.find((m) => m.id === id)?.name ?? id ?? "";
  const last = pg.turns.at(-1);

  // Keep the newest text (or the waiting skeleton) in view while it streams.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [pg.turns.length, last?.content.length]);

  useEffect(() => {
    if (pg.error?.kind === "unauthorized") router.push("/login?next=%2Fplayground");
  }, [pg.error, router]);

  // R2: what the next send holds at most, from the same body bytes and output cap the server uses.
  const nextBody = requestBody({ model: modelId, temperature, maxTokens }, [...pg.history, { role: "user", content: draft }]);
  const hold = pg.model ? formatMicros(holdMicros(bodyBytes(nextBody), outputCap(maxTokens, pg.model.maxCompletionTokens), pg.model)) : null;

  async function send() {
    if (!draft.trim() || pg.pending) return;
    const text = draft;
    setDraft("");
    const unsent = await pg.send(text);
    if (unsent) setDraft(unsent);
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
          <WorkAreaHeader modelName={pg.model?.name ?? ""} totals={pg.totals} view={view} onView={setView}
            canClear={pg.turns.length > 0} onClear={pg.clear} />
          {view === "chat" ? (
            <>
              <div ref={logRef} className="flex-1 overflow-y-auto overscroll-contain">
                {models.length === 0 ? <EmptyState icon={CubeIcon} title={copy.noModels.title} body={copy.noModels.body} /> : (
                  <ChatLog turns={pg.turns} initials={initials} modelName={nameOf} currentModel={pg.model?.name ?? ""} onSuggest={suggest} />
                )}
              </div>
              {pg.error && pg.error.kind !== "unauthorized" && <SendError error={pg.error} />}
              <ChatComposer draft={draft} pending={pg.pending} inputRef={inputRef} onDraftChange={setDraft} onSend={send}
                onStop={pg.stop} disabled={!pg.model} hold={hold} />
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <p className="mb-4 max-w-prose text-app-ui text-app-text-2">{copy.settings.codeHint}</p>
              <CodeBlock title="request.sh" code={code} lineNumbers />
            </div>
          )}
        </section>
        <aside className="lg:self-start">
          <SettingsPanel models={models} model={pg.model} settings={pg.settings} update={pg.update} />
        </aside>
      </div>
    </>
  );
}
