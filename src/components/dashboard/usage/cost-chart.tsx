import { formatMicros } from "@/lib/price-format";
import { usage as copy } from "./usage-copy";
import type { DailyCost } from "./usage-data";

// One series, so no legend: the card title names it. Bars in the accent (>= 3:1 on both surfaces), 4px rounded tops
// on the baseline, 2px gaps, a hover tooltip per day, and the same numbers as a table for screen readers.
const tooltip =
  "pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-app-inner " +
  "bg-app-text px-2 py-1 text-app-small text-app-surface shadow-app-raised group-hover:block";
const dayLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

function axisMax(maxMicros: number): number {
  const step = 5_000_000;
  return Math.ceil(maxMicros / step) * step;
}

export function CostChart({ days }: { days: DailyCost[] }) {
  const top = axisMax(Math.max(...days.map((d) => d.costMicros)));
  const ticks = [top, top / 2, 0];
  const labelAt = new Set([0, Math.floor(days.length / 2), days.length - 1]);

  return (
    <div className="px-6 pt-8 pb-5">
      <div className="flex gap-3">
        <div aria-hidden className="flex h-52 flex-col justify-between text-right font-mono text-app-small text-app-text-3">
          {ticks.map((t) => <span key={t} className="-translate-y-1/2 last:translate-y-1/2">{formatMicros(t)}</span>)}
        </div>
        <div className="relative flex-1">
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((t) => <span key={t} className="border-t border-app-border" />)}
          </div>
          <ul aria-hidden className="relative flex h-52 items-end gap-0.5">
            {days.map((d) => (
              <li key={d.date} className="group relative flex h-full flex-1 items-end">
                <span className="w-full rounded-t-bar bg-app-accent transition-opacity group-hover:opacity-75"
                  style={{ height: `${(d.costMicros / top) * 100}%` }} />
                <span className={tooltip}>
                  {dayLabel.format(new Date(d.date))} · <span className="font-mono tabular-nums">{formatMicros(d.costMicros)}</span>
                </span>
              </li>
            ))}
          </ul>
          <div aria-hidden className="mt-2 flex font-mono text-app-small text-app-text-3">
            {days.map((d, i) => (
              <span key={d.date} className="flex-1 text-center whitespace-nowrap">{labelAt.has(i) ? dayLabel.format(new Date(d.date)) : ""}</span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{copy.chartTable}</caption>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{dayLabel.format(new Date(d.date))}</th>
              <td>{formatMicros(d.costMicros)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
