import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { CodePane } from "@/components/dashboard/shared/code-pane";
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
  "-ml-px block border-l border-transparent py-1 pl-4 text-sm text-muted-foreground transition-colors " +
  `hover:border-foreground hover:text-foreground ${focusRing}`;

function ErrorTable() {
  const cols = s.errors.cols;
  return (
    <div className="overflow-x-auto pt-2">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="pb-2 font-normal">{cols.code}</th>
            <th scope="col" className="pb-2 font-normal">{cols.meaning}</th>
            <th scope="col" className="pb-2 font-normal">{cols.action}</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e) => (
            <tr key={e.code} className="border-t border-border align-top">
              <th scope="row" className="py-3 pr-4 text-left font-mono text-code font-medium text-destructive">{e.code}</th>
              <td className="py-3 pr-4 text-foreground">{e.meaning}</td>
              <td className="py-3 text-muted-foreground">{e.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** API reference in the dashboard: two-column topics with sticky examples, and an on-page index on wide screens. */
export function DocsView() {
  return (
    <div className="grid gap-10 xl:grid-cols-12">
      <div className="min-w-0 space-y-10 xl:col-span-9">
        <header className="max-w-prose">
          <h1 className="text-2xl font-semibold tracking-tight">{docs.title}</h1>
          <p className="mt-2 leading-relaxed text-muted-foreground">{docs.lead}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {docs.facts.map((f) => <li key={f} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{f}</li>)}
          </ul>
          <p className="mt-5 flex gap-2 rounded-panel bg-muted px-4 py-3 text-sm text-muted-foreground">
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden className="mt-0.5 size-4 shrink-0" />
            {docs.draft}
          </p>
        </header>
        <DocSection id="auth" title={s.auth.title} examples={<>
          <CodePane title="Base URL" code={BASE_URL} />
          <CodePane title={s.auth.header} code={authHeader} />
        </>}>
          {s.auth.body.map((p) => <p key={p}>{p}</p>)}
        </DocSection>
        <DocSection id="chat" title={s.chat.title} endpoint={{ method: "POST", path: "/chat/completions" }} examples={<>
          <RequestExample label={docs.request} />
          <CodePane title={docs.response} code={chatResponse} />
        </>}>
          <p>{s.chat.body}</p>
          <ParamList title={docs.params} params={chatParams} />
        </DocSection>
        <DocSection id="models" title={s.models.title} endpoint={{ method: "GET", path: "/models" }} examples={<>
          <CodePane title={docs.request} code={modelsRequest} />
          <CodePane title={docs.response} code={modelsResponse} />
        </>}>
          <p>{s.models.body}</p>
          <ParamList title={docs.fields} params={modelFields} />
        </DocSection>
        <DocSection id="errors" title={s.errors.title} examples={<CodePane title={docs.response} code={errorResponse} />}>
          <p>{s.errors.body}</p>
          <ErrorTable />
        </DocSection>
      </div>
      <nav aria-label={docs.toc} className="hidden xl:col-span-3 xl:block">
        <div className="sticky top-24">
          <p className="text-xs font-medium text-muted-foreground">{docs.toc}</p>
          <ul className="mt-3 space-y-1 border-l border-border">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className={tocLink}>
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
