"use client";

import { useState } from "react";
import { clampParam } from "./playground-request";

type NumberFieldProps = {
  id: string; label: string; hint: string; value: number; min: number; max: number; step: number; decimals?: number;
  onChange: (value: number) => void;
};

const frame =
  "flex h-10 items-center gap-2 rounded-app-control border border-app-border-strong bg-app-surface pl-3 transition-[border-color," +
  "box-shadow] duration-150 focus-within:border-app-accent focus-within:ring-3 focus-within:ring-app-accent/20 max-sm:w-full";

/**
 * A labelled number box for the toolbar. While typing it keeps the raw text (so "0." or an empty box is allowed) and
 * applies every value inside the range at once; on leaving it snaps back to the clamped value.
 */
export function NumberField({ id, label, hint, value, min, max, step, decimals = 0, onChange }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function type(text: string) {
    setDraft(text);
    const n = text.trim() === "" ? Number.NaN : Number(text);
    if (n >= min && n <= max) onChange(clampParam(n, min, max, decimals) ?? value);
  }

  function leave() {
    if (draft !== null && draft.trim() !== "") onChange(clampParam(Number(draft), min, max, decimals) ?? value);
    setDraft(null);
  }

  return (
    <div className={frame} title={hint}>
      <label htmlFor={id} className="text-app-small whitespace-nowrap text-app-text-2">{label}</label>
      <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={draft ?? String(value)}
        aria-describedby={`${id}-hint`} onChange={(e) => type(e.target.value)} onBlur={leave}
        className="h-full w-20 bg-transparent pr-3 text-right font-mono text-app-code text-app-text tabular-nums outline-none max-sm:flex-1" />
      <span id={`${id}-hint`} className="sr-only">{hint}</span>
    </div>
  );
}
