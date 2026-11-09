import { Card } from "@/components/app-kit/card";
import { cn } from "@/lib/utils";

export type SummaryStat = { label: string; value: string; note?: string; tone?: "danger" };

/** The period's headline figures in one card, split by hairlines (not a row of look-alike tiles). */
export function StatSummary({ stats, label }: { stats: SummaryStat[]; label: string }) {
  return (
    <Card>
      <dl aria-label={label} className="grid grid-cols-2 gap-px bg-app-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0 bg-app-surface px-4 py-5 sm:px-6">
            <dt className="text-app-small text-app-text-2">{s.label}</dt>
            <dd className="mt-1.5 truncate font-mono text-app-section text-app-text tabular-nums">{s.value}</dd>
            {s.note && <dd className={cn("mt-1 text-app-small", s.tone === "danger" ? "text-app-danger" : "text-app-text-3")}>{s.note}</dd>}
          </div>
        ))}
      </dl>
    </Card>
  );
}
