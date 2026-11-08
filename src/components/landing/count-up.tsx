"use client";

import { useEffect, useRef, useState } from "react";
import { formatMicros } from "@/lib/price-format";
import { formatCompact } from "@/lib/model-format";

export type CountFormat = "usd" | "compact" | "count" | "latency";

const DURATION_MS = 1400;
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));

function format(value: number, kind: CountFormat): string {
  if (kind === "usd") return formatMicros(Math.round(value / 10_000) * 10_000);
  if (kind === "compact") return formatCompact(value);
  if (kind === "latency") return `${Math.round(value)} ms`;
  return Math.round(value).toLocaleString("en-US");
}

/** Renders the final number (also without JS) and counts up from zero the first time it scrolls into view. */
export function CountUp({ value, kind }: { value: number; kind: CountFormat }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      // Start from the first frame's own timestamp: a rAF timestamp is the frame start and can be earlier than a
      // performance.now() taken just before, which made t negative and the eased value below zero (RangeError).
      let start = -1;
      const tick = (now: number) => {
        if (start < 0) start = now;
        const t = Math.min(1, Math.max(0, (now - start) / DURATION_MS));
        setShown(value * easeOutExpo(t));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(shown, kind)}
    </span>
  );
}
