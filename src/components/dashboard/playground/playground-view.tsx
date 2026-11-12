"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CubeIcon } from "@hugeicons/core-free-icons";
import { appFocus } from "@/components/app-kit/button";
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
import { PlaygroundToolbar } from "./playground-toolbar";
import { usePlayground } from "./use-playground";

type View = "chat" | "code";
const viewOptions: { value: View; label: string }[] = [
  { value: "chat", label: copy.views.chat },
  { value: "code", label: copy.views.code },
];
// Work area stays in view (spec: the playground transcript is the one box that scrolls on its own); full width, design B.
const workArea = "flex min-h-140 flex-col overflow-hidden rounded-app-card border border-app-border bg-app-surface lg:h-190";

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

type PlaygroundViewProps = { models: CatalogModel[]; baseUrl: string };

/** One full-width workbench: parameters in a row on top, then the conversation or its request as code. */
export function PlaygroundView({ models, baseUrl }: PlaygroundViewProps) {
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
      <PageHeader title={copy.title} sub={copy.sub}
        action={<Segmented label={copy.views.label} options={viewOptions} value={view} onChange={setView} />} />
      <section aria-label={copy.title} className={workArea}>
        <PlaygroundToolbar models={models} model={pg.model} settings={pg.settings} update={pg.update}
          canClear={pg.turns.length > 0} onClear={pg.clear} />
        {view === "chat" ? (
          <>
            <div ref={logRef} className="flex-1 overflow-y-auto overscroll-contain">
              {models.length === 0 ? <EmptyState icon={CubeIcon} title={copy.noModels.title} body={copy.noModels.body} /> : (
                <ChatLog turns={pg.turns} modelName={nameOf} currentModel={pg.model?.name ?? ""} onSuggest={suggest} />
              )}
            </div>
            {pg.error && pg.error.kind !== "unauthorized" && <SendError error={pg.error} />}
            <ChatComposer draft={draft} pending={pg.pending} inputRef={inputRef} onDraftChange={setDraft} onSend={send}
              onStop={pg.stop} disabled={!pg.model} hold={hold}
              session={copy.composer.session(pg.totals.tokens, formatMicros(pg.totals.costMicros))} />
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <p className="mb-4 max-w-prose text-app-ui text-app-text-2">{copy.settings.codeHint}</p>
            <CodeBlock title="request.sh" lang="bash" code={code} lineNumbers />
          </div>
        )}
      </section>
    </>
  );
}
