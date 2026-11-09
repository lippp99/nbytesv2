import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { appFocus } from "@/components/app-kit/button";
import { Badge } from "@/components/app-kit/badge";
import { CodeBlock } from "@/components/app-kit/code-block";
import { PageHeader } from "@/components/app-kit/page-header";
import { BASE_URL } from "@/lib/model-catalog";
import { DocSection } from "./doc-section";
import { docs } from "./docs-copy";
import { authHeader, chatParams, chatResponse, errorResponse, errors, modelFields, modelsRequest, modelsResponse } from "./docs-reference";
import { ParamList } from "./param-list";
import { RequestExample } from "./request-example";

const s = docs.sections;
const toc = [
  { id: "auth", label: s.auth.title },
  { id: "chat", label: s.chat.title },
  { id: "models", label: s.models.title },
  { id: "errors", label: s.errors.title },
];
const tocLink =
  "-ml-px block border-l border-transparent py-1.5 pl-4 text-app-ui text-app-text-2 transition-colors " +
  `hover:border-app-border-strong hover:text-app-text ${appFocus}`;

/** Status, meaning and what to do, as a list: it reads better than a table in a half-width column. */
function ErrorList() {
  return (
    <dl className="divide-y divide-app-border border-y border-app-border">
      {errors.map((e) => (
        <div key={e.code} className="flex gap-4 py-3">
          <dt className="w-10 shrink-0 font-mono text-app-code font-medium text-app-danger">{e.code}</dt>
          <dd className="min-w-0">
            <p className="text-app-ui text-app-text">{e.meaning}</p>
            <p className="mt-0.5 text-app-ui text-app-text-2">{e.action}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DraftNote() {
  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-2">
        {docs.facts.map((f) => <li key={f}><Badge>{f}</Badge></li>)}
      </ul>
      <p className="flex max-w-prose gap-2 rounded-app-control border border-app-border bg-app-inset px-4 py-3 text-app-ui text-app-text-2">
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden className="mt-0.5 size-4 shrink-0 text-app-text-3" />
        {docs.draft}
      </p>
    </div>
  );
}

/** API reference: two-column topics with sticky, theme-following examples, and an on-page index on wide screens. */
export function DocsView() {
  return (
    <div className="grid gap-10 xl:grid-cols-12">
      <div className="min-w-0 space-y-10 xl:col-span-9">
        <div>
          <PageHeader title={docs.title} sub={docs.lead} />
          <DraftNote />
        </div>
        <DocSection id="auth" title={s.auth.title} examples={<>
          <CodeBlock title="Base URL" code={BASE_URL} wrap />
          <CodeBlock title={s.auth.header} code={authHeader} wrap />
        </>}>
          {s.auth.body.map((p) => <p key={p}>{p}</p>)}
        </DocSection>
        <DocSection id="chat" title={s.chat.title} endpoint={{ method: "POST", path: "/chat/completions" }} examples={<>
          <RequestExample label={docs.request} />
          <CodeBlock title={docs.response} code={chatResponse} wrap />
        </>}>
          <p>{s.chat.body}</p>
          <ParamList title={docs.params} params={chatParams} />
        </DocSection>
        <DocSection id="models" title={s.models.title} endpoint={{ method: "GET", path: "/models" }} examples={<>
          <CodeBlock title={docs.request} code={modelsRequest} wrap />
          <CodeBlock title={docs.response} code={modelsResponse} wrap />
        </>}>
          <p>{s.models.body}</p>
          <ParamList title={docs.fields} params={modelFields} />
        </DocSection>
        <DocSection id="errors" title={s.errors.title} examples={<CodeBlock title={docs.response} code={errorResponse} wrap />}>
          <p>{s.errors.body}</p>
          <ErrorList />
        </DocSection>
      </div>
      <nav aria-label={docs.toc} className="hidden xl:col-span-3 xl:block">
        <div className="sticky top-24">
          <p className="text-app-small font-medium text-app-text-3">{docs.toc}</p>
          <ul className="mt-3 border-l border-app-border">
            {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className={tocLink}>{t.label}</a></li>)}
          </ul>
        </div>
      </nav>
    </div>
  );
}
