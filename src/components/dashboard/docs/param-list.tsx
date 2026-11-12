import { docs } from "./docs-copy";
import type { Param } from "./docs-reference";

/** Field reference: name, type and whether it is required on one line, the explanation under it. */
export function ParamList({ title, params }: { title: string; params: Param[] }) {
  return (
    <div className="pt-2">
      <h3 className="text-app-ui font-medium text-app-text">{title}</h3>
      <dl className="mt-3 divide-y divide-app-border border-y border-app-border">
        {params.map((p) => (
          <div key={p.name} className="py-3">
            <dt className="flex flex-wrap items-baseline gap-x-2">
              <code className="font-mono text-app-code font-medium text-app-text">{p.name}</code>
              <span className="font-mono text-app-small text-app-text-3">{p.type}</span>
              <span className={p.required ? "text-app-small font-medium text-app-text" : "text-app-small text-app-text-3"}>
                {p.required ? docs.required : docs.optional}
              </span>
            </dt>
            <dd className="mt-1 text-app-ui text-app-text-2">{p.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
