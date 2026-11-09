"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { WORDMARK, WORDMARK_BOUNDS as B, wordmarkLetters } from "./wordmark-glyphs";

// The viewBox hugs the ink plus PAD on every side (experientiallabs.ai does the same: "92 -8 7271 738"). PAD must
// cover half the widest stroke (10 units on phones) so no outline, the S overshoot included, is clipped.
const PAD = 8;
const BRAND_LETTERS = 2; // N and B take the logo orange

/**
 * Giant outlined word at the foot of the page, after experientiallabs.ai's footer mark (inspected via Pencil):
 * one path per letter with pathLength 1, the outlines draw in letter by letter when it scrolls into view, and the
 * letter under the pointer fills. Without JS or with reduced motion it simply shows drawn.
 */
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.armed = "";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.in = "";
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const viewBox = `${B.minX - PAD} ${B.minY - PAD} ${B.maxX - B.minX + PAD * 2} ${B.maxY - B.minY + PAD * 2}`;
  return (
    <div ref={ref} aria-hidden className="footer-wordmark leading-none">
      <svg viewBox={viewBox} className="block h-auto w-full">
        {wordmarkLetters.map((letter, i) => (
          <g key={letter.ch + i} className="footer-wordmark-letter" data-brand={i < BRAND_LETTERS || undefined}
            style={{ "--i": i } as CSSProperties}>
            <rect x={letter.x} y={B.minY} width={WORDMARK.advance} height={B.maxY - B.minY} fill="transparent" />
            <path d={letter.d} pathLength={1} />
          </g>
        ))}
      </svg>
    </div>
  );
}
