import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Carousel timer for the hero chart (jatevo.ai heroChart): moves to the next row every `dwell` ms, freezes while
 * `held` (hover, off screen, intro) and resumes with the time that was left, not a fresh dwell.
 */
export function useChartAutoplay(count: number, dwell: number, enabled: boolean, held: boolean) {
  const [active, setActive] = useState(0);
  const remaining = useRef(dwell);
  const reset = useRef(false);

  useEffect(() => {
    if (!enabled || held) return;
    if (reset.current) {
      remaining.current = dwell;
      reset.current = false;
    }
    const startedAt = performance.now();
    const id = setTimeout(() => {
      reset.current = true;
      setActive((i) => (i + 1) % count);
    }, remaining.current);
    return () => {
      clearTimeout(id);
      remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt));
    };
  }, [active, enabled, held, count, dwell]);

  /** Show row `i` now (hover, click, prev/next) and give it a full dwell. */
  const show = useCallback(
    (i: number) => {
      reset.current = true;
      remaining.current = dwell;
      setActive(((i % count) + count) % count);
    },
    [count, dwell],
  );

  return [active, show] as const;
}
