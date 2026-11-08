"use client";

import type { CSSProperties } from "react";
import { ProviderLogo } from "@/components/provider-logo";
import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { chart as copy } from "./landing-copy";
import type { Model } from "@/lib/model-catalog";

// Geometry and behaviour follow jatevo.ai's hero plot (landing.js heroChart): label column 122px (100px under
// 420px), rows share the height, ticks at each power of ten, a hover strip per row that shows it.
const PAD = { t: 6, b: 26 };
const ROW = 33.5;

type PlotProps = {
  rows: Model[];
  active: number;
  width: number;
  intro: boolean;
  onPick: (i: number) => void;
  onHover: (i: number) => void;
};

export function PricePlot({ rows, active, width, intro, onPick, onHover }: PlotProps) {
  const narrow = width < 420;
  const padL = narrow ? 100 : 122;
  const padR = narrow ? 10 : 16;
  const bottom = PAD.t + rows.length * ROW;
  const height = bottom + PAD.b;
  const ins = rows.map((m) => m.inputPerMTokMicros / 1e6);
  const outs = rows.map((m) => m.outputPerMTokMicros / 1e6);
  const L0 = Math.log10(Math.min(...ins) / 2.6);
  const L1 = Math.log10(Math.max(...outs) * 1.9);
  const x = (usd: number) => padL + ((Math.log10(usd) - L0) / (L1 - L0)) * (width - padL - padR);
  const y = (i: number) => PAD.t + ROW * (i + 0.5);
  const ticks: number[] = [];
  for (let e = Math.ceil(L0); e <= Math.floor(L1); e++) ticks.push(10 ** e);

  const m = rows[active];
  const ax = x(m.inputPerMTokMicros / 1e6);
  const ay = y(active);
  const lx = x(m.outputPerMTokMicros / 1e6);
  // the ring, guide and labels wait for the intro slide to finish, then pop in
  const late = { "--delay": intro ? "1450ms" : "0ms" } as CSSProperties;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={copy.label} className="block overflow-visible">
      {rows.map((r, i) => (
        <rect key={r.id} x={0} y={y(i) - ROW / 2 + 1} width={width} height={ROW - 2}
          className={cn("transition-colors duration-300 ease-out-quint", i === active ? "fill-accent-soft" : "fill-transparent")} />
      ))}
      {ticks.map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={PAD.t} y2={bottom} shapeRendering="crispEdges" className="stroke-border" />
          <text x={x(v)} y={height - 8} textAnchor="middle" fontSize={10.5} className="fill-muted-foreground">
            {v >= 1 ? `$${v}` : `$${v.toFixed(2)}`}
          </text>
        </g>
      ))}
      <line x1={padL} x2={width - padR} y1={bottom} y2={bottom} shapeRendering="crispEdges" className="stroke-faint" />
      {rows.map((r, i) => (
        <Row key={r.id} model={r} i={i} on={i === active} cy={y(i)} xi={x(r.inputPerMTokMicros / 1e6)} xo={x(r.outputPerMTokMicros / 1e6)} />
      ))}
      <g className="pointer-events-none">
        <g className="transition-transform duration-500 ease-out-quint" style={{ transform: `translate(${ax}px, 0)` }}>
          <g className="animate-lbl-fade" style={late}>
            <line y1={ay + 15} y2={bottom - 4} strokeWidth={1.2} strokeDasharray="1.5 3.5" strokeLinecap="round"
              className="stroke-accent-ink" />
            <circle cy={bottom} r={2.5} className="fill-accent-ink" />
          </g>
        </g>
        <g className="transition-transform duration-500 ease-out-quint" style={{ transform: `translate(${ax}px, ${ay}px)` }}>
          <g key={intro ? "intro" : "on"} className="animate-dot-pop" style={late}>
            <circle r={17} className="fill-accent-soft" />
            <circle r={12} strokeWidth={2.5} className="fill-background stroke-accent-strong" />
            <foreignObject x={-7} y={-7} width={14} height={14}>
              <ProviderLogo icon={m.icon} className="block size-3.5" />
            </foreignObject>
          </g>
        </g>
        <g key={`lbl-${m.id}`} className="animate-lbl-fade" style={{ "--delay": intro ? "1450ms" : "380ms" } as CSSProperties}>
          <text x={ax + 17} y={ay - 8} fontSize={13} fontWeight={600} className="fill-foreground tabular-nums">
            <tspan fontSize={11} fontWeight={400} className="fill-muted-foreground">{copy.input.toLowerCase()} </tspan>
            {formatMicros(m.inputPerMTokMicros)}
          </text>
          <text x={lx} y={ay + 18} textAnchor="middle" fontSize={11} className="fill-muted-foreground tabular-nums">
            {copy.output} {formatMicros(m.outputPerMTokMicros)}
          </text>
        </g>
      </g>
      {rows.map((r, i) => (
        <rect key={r.id} x={0} y={y(i) - ROW / 2} width={width} height={ROW} className="cursor-pointer fill-transparent"
          onPointerEnter={(e) => e.pointerType === "mouse" && onHover(i)} onClick={() => onPick(i)} />
      ))}
    </svg>
  );
}

type RowProps = { model: Model; i: number; on: boolean; cy: number; xi: number; xo: number };

/** One model row; on first paint the input dot slides in from the output price (jatevo's list-to-ours drop). */
function Row({ model, i, on, cy, xi, xo }: RowProps) {
  const slide = { "--from": `${xo - xi}px`, "--i": i } as CSSProperties;
  const draw = { transformOrigin: `${xo}px ${cy}px`, "--i": i } as CSSProperties;
  return (
    <g>
      <foreignObject x={0} y={cy - 7} width={14} height={14}>
        <ProviderLogo icon={model.icon} className="block size-3.5" />
      </foreignObject>
      <text x={20} y={cy + 4} fontSize={12} fontWeight={500}
        className={cn("transition-colors duration-200", on ? "fill-foreground" : "fill-foreground/80")}>{model.name}</text>
      <line x1={xi + 5} x2={Math.max(xi + 5, xo - 5)} y1={cy} y2={cy} style={draw}
        className={on ? "animate-dash stroke-accent-strong" : "animate-draw-in stroke-faint/70"}
        strokeWidth={on ? 1.6 : 1.25} strokeDasharray={on ? "3 3" : "2 3"} />
      <circle cx={xo} cy={cy} r={4} strokeWidth={1.5} className={cn("fill-background", on ? "stroke-foreground/80" : "stroke-faint")} />
      <circle cx={xi} cy={cy} r={4.5} strokeWidth={2} style={slide}
        className={cn("animate-slide-x fill-accent-strong stroke-background transition-opacity", on && "opacity-0")} />
    </g>
  );
}
