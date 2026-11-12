import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/app-kit/badge";
import { CodeBlock } from "@/components/app-kit/code-block";
import { PageHeader } from "@/components/app-kit/page-header";
import { DocSection } from "./doc-section";
import { docs } from "./docs-copy";
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

function StatusNote() {
  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-2">
        {docs.facts.map((f) => <li key={f}><Badge>{f}</Badge></li>)}
      </ul>
      <p className="flex max-w-prose gap-2 rounded-app-control border border-app-border bg-app-inset px-4 py-3 text-app-ui text-app-text-2">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden className="mt-0.5 size-4 shrink-0 text-app-text-3" />
        {docs.status}
      </p>
    </div>
  );
}

/** API reference: two-column topics with sticky, theme-following examples, and an on-page index on wide screens. */
export function DocsView({ baseUrl }: { baseUrl: string }) {
  return (
    <div className="grid gap-10 xl:grid-cols-12">
      <div className="min-w-0 space-y-10 xl:col-span-9">
        <div>
          <PageHeader title={docs.title} sub={docs.lead} />
          <StatusNote />
        </div>
        <DocSection id="auth" title={s.auth.title} examples={<>
          <CodeBlock title="Base URL" code={baseUrl} wrap />
          <CodeBlock title={s.auth.header} code={authHeader} wrap />
          <CodeBlock title={s.auth.altHeader} code={altAuthHeader} wrap />
        </>}>
          {paragraphs(s.auth.body)}
        </DocSection>
        <DocSection id="chat" title={s.chat.title} endpoint={{ method: "POST", path: "/chat/completions" }} examples={<>
          <RequestExample label={docs.request} baseUrl={baseUrl} />
          <CodeBlock title={docs.response} code={chatResponse} wrap />
        </>}>
          {paragraphs(s.chat.body)}
          <ParamList title={docs.params} params={chatParams} />
          <p className="text-app-ui">{s.chat.routing}</p>
        </DocSection>
        <DocSection id="streaming" title={s.streaming.title} examples={<>
          <CodeBlock title={docs.request} code={streamRequest(baseUrl)} wrap />
          <CodeBlock title={docs.response} code={streamResponse} wrap />
        </>}>
          {paragraphs(s.streaming.body)}
        </DocSection>
        <DocSection id="models" title={s.models.title} endpoint={{ method: "GET", path: "/models" }} examples={<>
          <CodeBlock title={docs.request} code={modelsRequest(baseUrl)} wrap />
          <CodeBlock title={docs.response} code={modelsResponse} wrap />
        </>}>
          {paragraphs(s.models.body)}
          <ParamList title={docs.fields} params={modelFields} />
        </DocSection>
        <DocSection id="errors" title={s.errors.title} examples={<CodeBlock title={docs.response} code={errorResponse} wrap />}
          wide={<ErrorTable />}>
          <p>{s.errors.body}</p>
        </DocSection>
        <DocSection id="limits" title={s.limits.title} examples={null}>
          {paragraphs(s.limits.body)}
        </DocSection>
      </div>
      <div className="hidden xl:col-span-3 xl:block">
        <DocsToc label={docs.toc} items={toc} />
      </div>
    </div>
  );
}
