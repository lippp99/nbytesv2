"use client";

import { useEffect, useRef, useState } from "react";
import { ProviderLogo } from "@/components/provider-logo";
import { cn } from "@/lib/utils";
import { mockFallback } from "./dashboard-mock-data";
import { features } from "./landing-copy";

// Step 0: request sent, 1: first provider rate limited, 2: second provider answers. Then it loops.
const STEP_MS = [900, 1100, 2600];
const FINAL = 2;

/** Plays the 429 -> 200 fallback on a loop while visible; shows the final state without JS or motion. */
export function FallbackCycle() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(FINAL);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % (FINAL + 1)), STEP_MS[step]);
    return () => clearTimeout(id);
  }, [visible, step]);

  const [first, second] = mockFallback;
  return (
    <div ref={ref}>
      <ol className="border border-border font-mono text-code">
        <Row icon={first.provider} name={first.provider} status={step >= 1 ? first.status : null} note={first.note} />
        <Row icon={second.provider} name={second.provider} status={step >= 2 ? second.status : null} note={second.note} dim={step < 1} />
      </ol>
      <p className={cn("mt-6 text-muted-foreground transition-opacity duration-500", step < FINAL && "opacity-0")}>
        {features.fallback.result}
      </p>
    </div>
  );
}

type RowProps = { icon: string; name: string; status: number | null; note: string; dim?: boolean };

function Row({ icon, name, status, note, dim }: RowProps) {
  const ok = status !== null && status < 300;
  return (
    <li
      className={cn(
        "grid grid-cols-3 items-center gap-3 border-b border-border px-4 py-4 transition-opacity duration-300 last:border-b-0",
        dim && "opacity-30",
      )}
    >
      <span className="flex items-center gap-2">
        <ProviderLogo icon={icon} className="size-4" />
        {name}
      </span>
      <span className={cn("transition-opacity duration-300", status === null && "opacity-0", ok ? "text-success" : "text-warn")}>
        {status ?? "000"}
      </span>
      <span className={cn("text-right text-muted-foreground transition-opacity duration-300", status === null && "opacity-0")}>
        {note}
      </span>
    </li>
  );
}
