"use client";

import Image from "next/image";
import { type RefObject, useEffect, useRef, useState } from "react";
import nbMark from "../../../../public/brand/nb-orange.png";

type Geometry = { w: number; h: number; inPath: string; outs: string[] };
type HubWiresProps = { toolRefs: RefObject<(HTMLButtonElement | null)[]>; active: number; label: string };

const f = (n: number) => n.toFixed(1);
const nodeClass =
  "absolute top-1/2 left-1/2 z-10 grid w-26 -translate-1/2 justify-items-center gap-2 rounded-panel border border-foreground/15 bg-background " +
  "px-2 pt-4 pb-3.5 text-center text-xs font-medium shadow-xl shadow-foreground/8";

/**
 * The middle column on desktop: a hub tile with dotted bezier wires from the setup card in, and out to every tool.
 * Same geometry as jatevo.ai (landing.js draw()): curves bend at the midpoint, the chosen tool's wire is dashed accent.
 */
export function HubWires({ toolRefs, active, label }: HubWiresProps) {
  const hub = useRef<HTMLDivElement>(null);
  const node = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);

  useEffect(() => {
    const el = hub.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    const draw = () => {
      const nodeEl = node.current;
      if (!nodeEl || getComputedStyle(el).display === "none") return setGeo(null);
      const hb = el.getBoundingClientRect();
      const nb = nodeEl.getBoundingClientRect();
      const panel = document.getElementById("setup-panel")?.getBoundingClientRect();
      const nl = nb.left - hb.left;
      const nx = nb.right - hb.left;
      const ny = nb.top - hb.top + nb.height / 2;
      const inY = panel ? Math.min(Math.max(ny, panel.top - hb.top + 40), panel.bottom - hb.top - 40) : ny;
      const outs = (toolRefs.current ?? []).map((t) => {
        if (!t) return "";
        const tb = t.getBoundingClientRect();
        const tx = tb.left - hb.left;
        const ty = tb.top - hb.top + tb.height / 2;
        const mx = nx + (tx - nx) / 2;
        return `M${f(nx)} ${f(ny)} C ${f(mx)} ${f(ny)}, ${f(mx)} ${f(ty)}, ${f(tx)} ${f(ty)}`;
      });
      const inPath = `M0 ${f(inY)} C ${f(nl / 2)} ${f(inY)}, ${f(nl / 2)} ${f(ny)}, ${f(nl)} ${f(ny)}`;
      setGeo({ w: hb.width, h: hb.height, inPath, outs });
    };
    const observer = new ResizeObserver(draw);
    observer.observe(box);
    document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [toolRefs]);

  return (
    <div ref={hub} aria-hidden className="relative hidden min-h-90 self-stretch lg:block">
      {geo && (
        <svg viewBox={`0 0 ${f(geo.w)} ${f(geo.h)}`} className="absolute inset-0 size-full overflow-visible">
          <path d={geo.inPath} fill="none" strokeWidth={1.6} strokeDasharray="3 3" className="animate-dash stroke-accent-strong" />
          {geo.outs.map((d, i) => (
            <path key={i} d={d} fill="none" vectorEffect="non-scaling-stroke"
              strokeWidth={i === active ? 1.6 : 1.2} strokeDasharray={i === active ? "3 3" : "2 4"}
              className={i === active ? "animate-dash stroke-accent-strong" : "stroke-foreground/30"} />
          ))}
        </svg>
      )}
      <div ref={node}
        className={nodeClass}>
        <Image src={nbMark} alt="" sizes="40px" className="size-10 object-contain" />
        {label}
      </div>
    </div>
  );
}
