"use client";

import { type FormEvent, useId, useState } from "react";
import { secondaryAction } from "@/components/app-kit/button";
import { TextInput } from "@/components/app-kit/field";
import { type RangeProblem, rangeError } from "@/lib/admin-gateway/usage-contract";
import { periodCopy as copy, rangeErrorText } from "./period-copy";

type PeriodRangeFormProps = {
  initial: { from: string; to: string };
  /** WIB day the page was rendered; the last day a range may end on. */
  today: string;
  pending: boolean;
  onApply: (from: string, to: string) => void;
};

/** Two native date fields (platform picker and keyboard) checked by the shared range rules before the URL changes. */
export function PeriodRangeForm({ initial, today, pending, onApply }: PeriodRangeFormProps) {
  const id = useId();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [problem, setProblem] = useState<RangeProblem | null>(null);
  const errorId = `${id}-error`;

  function submit(event: FormEvent) {
    event.preventDefault();
    const found = rangeError(from, to, today);
    setProblem(found);
    if (!found) onApply(from, to);
  }

  const field = (key: "from" | "to", value: string, set: (v: string) => void) => (
    <div className="min-w-0">
      <label htmlFor={`${id}-${key}`} className="mb-1.5 block text-app-small text-app-text-2">
        {key === "from" ? copy.fromLabel : copy.toLabel}
      </label>
      <TextInput id={`${id}-${key}`} type="date" value={value} max={today} required className="w-44 font-mono tabular-nums"
        aria-invalid={problem ? true : undefined} aria-describedby={problem ? errorId : undefined}
        onChange={(e) => set(e.target.value)} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="min-w-0">
      <div className="flex flex-wrap items-end gap-3">
        {field("from", from, setFrom)}
        {field("to", to, setTo)}
        <button type="submit" disabled={pending} aria-busy={pending || undefined} className={secondaryAction()}>{copy.apply}</button>
      </div>
      {problem && <p id={errorId} role="alert" className="mt-1.5 text-app-small text-app-danger">{rangeErrorText[problem]}</p>}
    </form>
  );
}
