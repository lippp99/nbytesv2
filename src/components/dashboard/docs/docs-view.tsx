import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CodeBlock } from "@/components/app-kit/code-block";
import { PageHeader } from "@/components/app-kit/page-header";
import { DocSection } from "./doc-section";
import { docs, keyRateText } from "./docs-copy";
import { ConnectionRows, EndpointIndex } from "./docs-overview";
import {
  altAuthHeader, authHeader, chatParams, chatResponse, errorResponse, modelFields, modelsRequest, modelsResponse,
  streamRequest, streamResponse,
} from "./docs-reference";
import { DocsToc } from "./docs-toc";
import { ErrorTable } from "./error-table";
import { ParamList } from "./param-list";
import { RequestExample } from "./request-example";

const s = docs.sections;
const toc = (["auth", "chat", "streaming", "models", "errors", "limits"] as const).map((id) => ({ id, label: s[id].title }));
const paragraphs = (lines: string[]) => lines.map((p) => <p key={p}>{p}</p>);
// Code on the inset example column sits on the surface tone, so the well still reads as a well.
const onInset = "bg-app-surface";

function StatusNote() {
  return (
    <div className="flex flex-col gap-2 text-app-ui text-app-text-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
      <p className="text-app-text">{docs.facts.join(" · ")}</p>
      <p className="flex gap-2">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden className="mt-0.5 size-4 shrink-0 text-app-text-3" />
        {docs.status}
      </p>
    </div>
  );
}

/** API reference: endpoint summary, a sticky section bar, then one frame of topics with sticky, theme-following examples. */
/** `keyRpm`: the per-key request limit set on the admin Settings page, shown in Limits and in the error table. */
export function DocsView({ baseUrl, keyRpm }: { baseUrl: string; keyRpm: number }) {
  const rate = keyRateText(keyRpm);
  const base = { label: docs.connection.baseUrl, value: baseUrl };
  const header = { label: s.auth.header, value: authHeader };
  return (
    <div className="space-y-8">
      <div>
        {/* own grid, not PageHeader's action slot: that slot is content-sized and would overflow a phone with the long URL */}
        <div className="grid gap-x-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-end">
          <PageHeader title={docs.title} sub={docs.lead} />
          <ConnectionRows rows={[base, header]} className="mb-8" />
        </div>
        <StatusNote />
      </div>
      <EndpointIndex />
      <div>
        <DocsToc label={docs.toc} items={toc} />
        {/* overflow-clip, not hidden: hidden would make a scroll box and stop the sticky example columns */}
        <div className="mt-8 overflow-clip rounded-app-card border border-app-border bg-app-surface">
          <DocSection id="auth" title={s.auth.title}
            examples={<ConnectionRows rows={[base, header, { label: s.auth.altHeader, value: altAuthHeader }]} />}>
            {paragraphs(s.auth.body)}
          </DocSection>
          <DocSection id="chat" title={s.chat.title} endpoint={{ method: "POST", path: "/chat/completions" }} examples={<>
            <RequestExample label={docs.request} baseUrl={baseUrl} codeClassName={onInset} />
            <CodeBlock title={docs.response} lang="json" code={chatResponse} wrap className={onInset} />
          </>}>
            {paragraphs(s.chat.body)}
            <ParamList title={docs.params} params={chatParams} />
            <p className="text-app-ui">{s.chat.routing}</p>
          </DocSection>
          <DocSection id="streaming" title={s.streaming.title} examples={<>
            <CodeBlock title={docs.request} lang="bash" code={streamRequest(baseUrl)} wrap className={onInset} />
            <CodeBlock title={docs.response} code={streamResponse} wrap className={onInset} />
          </>}>
            {paragraphs(s.streaming.body)}
          </DocSection>
          <DocSection id="models" title={s.models.title} endpoint={{ method: "GET", path: "/models" }} examples={<>
            <CodeBlock title={docs.request} lang="bash" code={modelsRequest(baseUrl)} wrap className={onInset} />
            <CodeBlock title={docs.response} lang="json" code={modelsResponse} wrap className={onInset} />
          </>}>
            {paragraphs(s.models.body)}
            <ParamList title={docs.fields} params={modelFields} />
          </DocSection>
          <DocSection id="errors" title={s.errors.title}
            examples={<CodeBlock title={docs.response} lang="json" code={errorResponse} wrap className={onInset} />} wide={<ErrorTable rate={rate} />}>
            <p>{s.errors.body}</p>
          </DocSection>
          <DocSection id="limits" title={s.limits.title} examples={null}>
            {paragraphs(s.limits.body(rate))}
          </DocSection>
        </div>
      </div>
    </div>
  );
}
