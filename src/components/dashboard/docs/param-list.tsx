import { docs } from "./docs-copy";
import type { Param } from "./docs-reference";

/** Field reference in a card: name and type, the explanation, and whether it is required; stacked below sm. */
export function ParamList({ title, params }: { title: string; params: Param[] }) {
  return (
    <div className="pt-2">
      <h3 className="text-app-card text-app-text">{title}</h3>
      <dl className="mt-3 divide-y divide-app-border overflow-hidden rounded-app-card border border-app-border bg-app-surface">
        {params.map((p) => (
          <div key={p.name} className="grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[12rem_minmax(0,1fr)_4rem]">
            <dt className="min-w-0">
              <code className="block font-mono text-app-code font-medium break-words text-app-text">{p.name}</code>
              <span className="font-mono text-app-small text-app-text-3">{p.type}</span>
            </dt>
            <dd className="text-app-ui text-app-text-2">{p.body}</dd>
            <dd className={p.required
              ? "text-app-small font-medium text-app-text sm:text-right"
              : "text-app-small text-app-text-3 sm:text-right"}>
              {p.required ? docs.required : docs.optional}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
