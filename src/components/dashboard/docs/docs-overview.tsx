import { ArrowDown02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { appFocus } from "@/components/app-kit/button";
import { CopyButton } from "@/components/copy-button";
import { common } from "@/components/dashboard/shared/common-copy";
import { cn } from "@/lib/utils";
import { methodTag } from "./doc-section";
import { docs } from "./docs-copy";

const ov = docs.overview;

/** Label, value, copy: the strings a reader pastes into their own code (base URL, headers). */
export function ConnectionRows({ rows, className }: { rows: { label: string; value: string }[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-app-border rounded-app-code border border-app-border bg-app-surface", className)}>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 py-1 pr-1 pl-4">
          <dt className="w-28 shrink-0 text-app-small text-app-text-2">{r.label}</dt>
          <dd className="min-w-0 flex-1 font-mono text-app-code break-all text-app-text">{r.value}</dd>
          <CopyButton text={r.value} label={`${common.copy} ${r.label}`} copiedLabel={common.copied} failedLabel={common.copyFailed} iconOnly
            className="rounded-app-inner" />
        </div>
      ))}
    </dl>
  );
}

const row = "grid gap-x-6 gap-y-1 px-5 sm:grid-cols-[18rem_minmax(0,1fr)_auto] sm:items-center";

/** Every endpoint that exists today, each row jumps to its section. */
export function EndpointIndex() {
  return (
    <nav aria-label={ov.label} className="overflow-hidden rounded-app-card border border-app-border bg-app-surface">
      <div aria-hidden className={cn(row, "hidden h-11 border-b border-app-border bg-app-inset text-app-small font-medium text-app-text-3 sm:grid")}>
        <span>{ov.endpoint}</span>
        <span>{ov.use}</span>
      </div>
      <ul className="divide-y divide-app-border">
        {ov.items.map((e) => (
          <li key={e.path}>
            <a href={e.href} className={cn(row, "group py-3 transition-colors duration-150 hover:bg-app-hover sm:min-h-13 sm:py-0", appFocus)}>
              <span className="flex items-center gap-2.5">
                <span className={methodTag}>{e.method}</span>
                <code className="font-mono text-app-code text-app-text">{e.path}</code>
              </span>
              <span className="text-app-ui text-app-text-2">{e.use}</span>
              <HugeiconsIcon icon={ArrowDown02Icon} aria-hidden
                className="hidden size-4 text-app-text-3 transition-colors group-hover:text-app-text sm:block" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
