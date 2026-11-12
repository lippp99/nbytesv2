import { cn } from "@/lib/utils";

// Daily bar chart for the dashboard and admin (dataviz skill): thin bars with 4px rounded tops on the baseline, a 2px
// surface gap between neighbours, recessive grid, one y-axis, a hover tooltip per day, a legend (>= 2 series, never
// colour alone) and the same numbers as a table for screen readers. Series colours come from validated tokens only.

export type BarSeries = { name: string; className: string };
export type BarDay = { date: string; values: number[] };
type BarChartProps = {
  series: BarSeries[];
  days: BarDay[];
  /** grouped: series side by side; stacked: one bar per day, first series at the bottom. */
  mode: "grouped" | "stacked";
  format: (value: number) => string;
  tableCaption: string;
  /** Header of the date column in the screen-reader table. */
  dateHeader: string;
};

const dayLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });
const label = (date: string) => dayLabel.format(new Date(`${date}T00:00:00Z`));
const tooltip =
  "pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-app-inner " +
  "bg-app-text px-2 py-1 text-app-small text-app-surface shadow-app-raised group-hover:block";

/** 1, 2 or 5 × 10^n at or above the largest value, so the top tick is a round number. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value)!;
  return step * power;
}

function Legend({ series }: { series: BarSeries[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-app-small text-app-text-2">
      {series.map((s) => (
        <li key={s.name} className="flex items-center gap-2">
          <span aria-hidden className={cn("size-2.5 rounded-full", s.className)} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function Bars({ day, series, mode, top }: { day: BarDay; series: BarSeries[]; mode: BarChartProps["mode"]; top: number }) {
  const height = (v: number) => `${(v / top) * 100}%`;
  if (mode === "stacked") {
    return (
      <span className="flex h-full w-full flex-col-reverse gap-0.5">
        {series.map((s, i) => day.values[i] > 0 && (
          <span key={s.name} className={cn("w-full shrink-0 last:rounded-t-bar", s.className)} style={{ height: height(day.values[i]) }} />
        ))}
      </span>
    );
  }
  return (
    <span className="flex h-full w-full items-end gap-0.5">
      {series.map((s, i) => (
        <span key={s.name} className={cn("flex-1 rounded-t-bar", s.className)} style={{ height: height(day.values[i]) }} />
      ))}
    </span>
  );
}

export function BarChart({ series, days, mode, format, tableCaption, dateHeader }: BarChartProps) {
  const totals = days.map((d) => (mode === "stacked" ? d.values.reduce((a, b) => a + b, 0) : Math.max(...d.values)));
  const top = niceMax(Math.max(0, ...totals));
  const ticks = [top, top / 2, 0];
  const labelAt = new Set([0, Math.floor(days.length / 2), days.length - 1]);
  return (
    <div className="px-6 pt-5 pb-5">
      <Legend series={series} />
      <div className="flex gap-3">
        <div aria-hidden className="flex h-52 flex-col justify-between text-right font-mono text-app-small text-app-text-3 tabular-nums">
          {ticks.map((t) => <span key={t} className="-translate-y-1/2 last:translate-y-1/2">{format(t)}</span>)}
        </div>
        <div className="relative min-w-0 flex-1">
          <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
            {ticks.map((t) => <span key={t} className="border-t border-app-border" />)}
          </div>
          <ul aria-hidden className="relative flex h-52 items-end gap-0.5">
            {days.map((d) => (
              <li key={d.date} className="group relative flex h-full flex-1 items-end hover:opacity-80">
                <Bars day={d} series={series} mode={mode} top={top} />
                <span className={tooltip}>
                  {label(d.date)} · {series.map((s, i) => `${s.name} ${format(d.values[i])}`).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
          <div aria-hidden className="mt-2 flex font-mono text-app-small text-app-text-3">
            {days.map((d, i) => (
              <span key={d.date} className="flex-1 text-center whitespace-nowrap">{labelAt.has(i) ? label(d.date) : ""}</span>
            ))}
          </div>
        </div>
      </div>
      <table className="sr-only">
        <caption>{tableCaption}</caption>
        <thead><tr><th scope="col">{dateHeader}</th>{series.map((s) => <th key={s.name} scope="col">{s.name}</th>)}</tr></thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{label(d.date)}</th>
              {d.values.map((v, i) => <td key={series[i].name}>{format(v)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
