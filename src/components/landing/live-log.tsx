"use client";

import { useEffect, useRef, useState } from "react";
import { ProviderLogo } from "@/components/provider-logo";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { type LogEntry, mockLogPool, mockLogSeed } from "./dashboard-mock-data";
import { dashboard } from "./landing-copy";
import { modelById } from "@/lib/model-catalog";

const TICK_MS = 2400;
const MAX_ROWS = 7;
const cols = dashboard.history;
const clock = (d: Date) => d.toLocaleTimeString("en-GB", { hour12: false });

/** Request history that streams a new mock row every few seconds while it is on screen. */
export function LiveLog() {
  const ref = useRef<HTMLTableSectionElement>(null);
  const [rows, setRows] = useState<LogEntry[]>(mockLogSeed);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    let next = 1000;
    const push = () => {
      const row = mockLogPool[next % mockLogPool.length];
      setRows((prev) => [{ ...row, id: next++, time: clock(new Date()) }, ...prev].slice(0, MAX_ROWS));
    };
    const observer = new IntersectionObserver(([entry]) => {
      clearInterval(timer);
      if (entry.isIntersecting) timer = setInterval(push, TICK_MS);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, []);

  return (
    <table className="w-full table-fixed text-sm">
      <thead className="text-muted-foreground">
        <tr className="border-b border-border text-left">
          <th scope="col" className="hidden w-22 py-2.5 pl-4 font-normal sm:table-cell">{cols.time}</th>
          <th scope="col" className="w-20 py-2.5 pl-4 font-normal sm:w-24 sm:pl-0">{cols.status}</th>
          <th scope="col" className="py-2.5 font-normal">{cols.model}</th>
          <th scope="col" className="hidden w-24 py-2.5 font-normal sm:table-cell">{cols.tag}</th>
          <th scope="col" className="w-20 py-2.5 pr-4 text-right font-normal">{cols.cost}</th>
        </tr>
      </thead>
      <tbody ref={ref} className="font-mono text-code tabular-nums">
        {rows.map((row) => (
          <LogRow key={row.id} row={row} fresh={row.id >= 1000} />
        ))}
      </tbody>
    </table>
  );
}

function LogRow({ row, fresh }: { row: LogEntry; fresh: boolean }) {
  const model = modelById(row.modelId);
  const ok = row.status < 300;
  return (
    <tr className={cn("border-b border-border last:border-b-0", fresh && "animate-row-in")}>
      <td className="hidden py-2.5 pl-4 text-muted-foreground sm:table-cell">{row.time}</td>
      <td className="py-2.5 pl-4 sm:pl-0">
        <span className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", ok ? "bg-success" : "bg-destructive")} />
          {row.retried && <span className="text-warn">429→</span>}
          <span className={ok ? "" : "text-destructive"}>{row.status}</span>
        </span>
      </td>
      <td className="py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          {model && <ProviderLogo icon={model.icon} className="size-4" />}
          <span className="truncate">{row.modelId}</span>
        </span>
      </td>
      <td className="hidden py-2.5 sm:table-cell">
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{row.tag}</span>
      </td>
      <td className={cn("py-2.5 pr-4 text-right", row.costMicros === 0 && "text-muted-foreground")}>
        {formatMicros(row.costMicros)}
      </td>
    </tr>
  );
}
