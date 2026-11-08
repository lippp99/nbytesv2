import { docs } from "./docs-copy";
import type { Param } from "./docs-reference";

/** Field reference: name, type and whether it is required on one line, the explanation under it. */
export function ParamList({ title, params }: { title: string; params: Param[] }) {
  return (
    <div className="pt-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <dl className="mt-3 divide-y divide-border border-y border-border">
        {params.map((p) => (
          <div key={p.name} className="py-3">
            <dt className="flex flex-wrap items-baseline gap-x-2">
              <code className="font-mono text-code font-medium text-foreground">{p.name}</code>
              <span className="font-mono text-xs text-muted-foreground">{p.type}</span>
              <span className={p.required ? "text-xs font-medium text-accent-ink" : "text-xs text-faint"}>
                {p.required ? docs.required : docs.optional}
              </span>
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">{p.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
