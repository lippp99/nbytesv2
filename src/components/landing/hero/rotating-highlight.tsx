"use client";

import { type CSSProperties, useEffect, useState } from "react";

const HOLD_MS = 3200;
const SWAP_MS = 400;

/**
 * Highlighted word that cycles through `words`: the orange block wipes out to the right, the word swaps,
 * and the block draws back in from the left. The first word is what renders without JS or with reduced motion.
 */
export function RotatingHighlight({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [cycled, setCycled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const hold = () => {
      timer = setTimeout(() => {
        setPhase("out");
        timer = setTimeout(() => {
          setIndex((i) => (i + 1) % words.length);
          setCycled(true);
          setPhase("in");
          hold();
        }, SWAP_MS);
      }, HOLD_MS);
    };
    hold();
    return () => clearTimeout(timer);
  }, [words.length]);

  // First draw waits for the headline words to land; later draws start right after the swap.
  const style = { "--delay": cycled ? "0ms" : "650ms" } as CSSProperties;

  return (
    <span className="hl" data-phase={phase} style={style}>
      <span className="hl-word">{words[index]}</span>
    </span>
  );
}
