"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon } from "@/components/landing/shared/icons/arrow-left";
import { ArrowLeftRoundIcon } from "@/components/landing/shared/icons/arrow-left-round";
import { PauseIcon } from "@/components/landing/shared/icons/pause";
import { PlayIcon } from "@/components/landing/shared/icons/play";
import { ArrowRightIcon } from "@/components/icons/ui/arrow-right";
import { focusRing } from "@/components/button-styles";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { chart as copy } from "../../shared/landing-copy";
import { modelById, providerById, type Model } from "@/lib/model-catalog";
import { chartModelIds } from "../../shared/landing-mock-data";
import { formatContext } from "@/lib/model-format";
import { PricePlot } from "./price-plot";
import { useChartAutoplay } from "./use-chart-autoplay";
import { useReducedMotion } from "./use-reduced-motion";

const DWELL_MS = 3200;
const INTRO_MS = 1600;
const rows = chartModelIds.map((id) => modelById(id)).filter((m): m is Model => !!m);
const iconButton = cn(
  "inline-grid size-11 place-items-center text-foreground/80 transition-colors duration-150 hover:bg-muted sm:size-8 [&_svg]:size-3.5",
  focusRing,
);

/** Hero price chart modelled on jatevo.ai: auto-advancing highlighted row, ring marker, stats that swap in. */
export function PriceChart() {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [intro, setIntro] = useState(true);
  const reduced = useReducedMotion();
  const autoplay = playing && !reduced;
  const hold = hover || offscreen;
  const [active, show] = useChartAutoplay(rows.length, DWELL_MS, autoplay, hold || intro);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const resize = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    const view = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    resize.observe(el);
    view.observe(el);
    // the dots slide in first (about 1.5 s); the carousel starts after
    const id = setTimeout(() => setIntro(false), INTRO_MS);
    return () => {
      resize.disconnect();
      view.disconnect();
      clearTimeout(id);
    };
  }, []);

  const go = (step: number) => show(active + step);

  return (
    <figure
      data-hold={hold || undefined}
      className="m-0 min-w-0 animate-enter-up"
      style={{ "--delay": "200ms", "--dwell": `${DWELL_MS}ms` } as CSSProperties}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span>
          {copy.title} <span className="text-faint">{copy.unit}</span>
        </span>
        <span className="inline-flex gap-3.5">
          <span className="inline-flex items-center gap-1.5"><i className="size-2.25 rounded-full bg-accent-strong" />{copy.input}</span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2.25 rounded-full border border-faint bg-background" />{copy.output}
          </span>
        </span>
      </div>
      <div ref={box}>
        <PricePlot rows={rows} active={active} width={width} onPick={show} onHover={show} />
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowLeftIcon className="size-4.5" />
          {copy.cheaper}
        </span>
        <div className="flex items-center">
          <span aria-hidden className="relative mr-2 py-1.5 font-mono text-xs text-muted-foreground tabular-nums">
            <b className="font-medium text-foreground">{active + 1}</b> / {rows.length}
            {autoplay && !intro && <span key={active} className="absolute inset-x-0 bottom-px h-px origin-left animate-tick-fill bg-foreground" />}
          </span>
          <button type="button" className={iconButton} onClick={() => setPlaying(!autoplay)} aria-label={autoplay ? copy.pause : copy.play}>
            {autoplay ? <PauseIcon className="size-4!" /> : <PlayIcon className="size-4!" />}
          </button>
          <button type="button" className={iconButton} onClick={() => go(-1)} aria-label={copy.prev}>
            <ArrowLeftRoundIcon />
          </button>
          <button type="button" className={iconButton} onClick={() => go(1)} aria-label={copy.next}>
            <ArrowRightIcon />
          </button>
        </div>
      </div>
      <ChartStats model={rows[active]} />
      <p className="mt-4 text-xs text-faint">{copy.note}</p>
    </figure>
  );
}

function ChartStats({ model }: { model: Model }) {
  const provider = providerById(model.providerId)?.name;
  const ratio = Math.round(model.outputPerMTokMicros / model.inputPerMTokMicros);
  const stats = [
    { label: copy.stats.input, value: formatMicros(model.inputPerMTokMicros), small: copy.perM, sub: `${copy.sub.via} ${provider}` },
    { label: copy.stats.output, value: formatMicros(model.outputPerMTokMicros), small: copy.perM, sub: `${ratio}${copy.sub.ratio}` },
    { label: copy.stats.context, value: formatContext(model.contextTokens), small: copy.upTo, sub: copy.sub.context, live: true },
  ];
  return (
    <dl aria-live="polite" className="mt-5 grid grid-cols-3 gap-3 border-t border-dashed border-guide pt-5">
      {stats.map((s, i) => (
        <div key={s.label} className="min-w-0">
          <dt className="text-sm text-muted-foreground">{s.label}</dt>
          <dd key={model.id} className="mt-1.5 flex animate-slot-in flex-wrap items-center gap-x-1.5" style={{ "--i": i } as CSSProperties}>
            {s.live && <i aria-hidden className="size-1.5 animate-live rounded-full bg-success" />}
            {s.live && <small className="text-xs text-muted-foreground">{s.small}</small>}
            <span className="text-2xl font-medium tracking-tight tabular-nums">{s.value}</span>
            {!s.live && <small className="text-xs text-muted-foreground">{s.small}</small>}
          </dd>
          <dd className="mt-1 truncate text-xs text-faint">{s.sub}</dd>
        </div>
      ))}
    </dl>
  );
}
