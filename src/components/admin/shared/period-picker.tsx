"use client";

import { useState } from "react";
import { Select } from "@/components/app-kit/field";
import { Segmented } from "@/components/app-kit/segmented";
import { PERIOD_KINDS, type PeriodKind, type UsagePeriod } from "@/lib/admin-gateway/usage-contract";
import { periodCopy as copy, periodLabels } from "./period-copy";
import { PeriodRangeForm } from "./period-range-form";

const kindOptions = PERIOD_KINDS.map((value) => ({ value, label: periodLabels[value] }));

export type PeriodPickerProps = {
  period: UsagePeriod;
  currentMonth: string;
  /** UTC day the page was rendered; the last day a range may end on. */
  today: string;
  months: { value: string; label: string }[];
  years: string[];
  pending: boolean;
  onPick: (period: UsagePeriod) => void;
};

/**
 * Month, year or date range. Month and year apply on change; a range waits for both dates and the Apply button.
 * Picking a kind is kept here until it applies, so give the picker a key of the applied kind to reset it.
 */
export function PeriodPicker({ period: p, currentMonth, today, months, years, pending, onPick }: PeriodPickerProps) {
  const [kind, setKind] = useState<PeriodKind>(p.kind);

  function pickKind(next: PeriodKind) {
    setKind(next);
    if (next === "month") onPick({ kind: "month", month: months[0].value });
    if (next === "year") onPick({ kind: "year", year: years[0] });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Segmented label={copy.periodLabel} options={kindOptions} value={kind} onChange={pickKind} />
      {kind === "month" && (
        <div className="w-48">
          <Select aria-label={copy.monthLabel} value={p.kind === "month" ? p.month : months[0].value} disabled={pending}
            onChange={(e) => onPick({ kind: "month", month: e.target.value })}>
            {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
      )}
      {kind === "year" && (
        <div className="w-32">
          <Select aria-label={copy.yearLabel} value={p.kind === "year" ? p.year : years[0]} disabled={pending}
            onChange={(e) => onPick({ kind: "year", year: e.target.value })}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
      )}
      {kind === "range" && (
        <PeriodRangeForm initial={p.kind === "range" ? p : { from: `${currentMonth}-01`, to: today }} today={today}
          pending={pending} onApply={(from, to) => onPick({ kind: "range", from, to })} />
      )}
    </div>
  );
}
