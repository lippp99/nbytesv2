"use client";

import { useEffect } from "react";

/**
 * Scroll reveal for `[data-reveal]` (fade + rise + un-blur, staggered by the `--i` style variable).
 * Items start visible; only this script hides the ones still below the fold, so content shows without JS.
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove("is-pending");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) continue;
      el.classList.add("is-pending");
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return null;
}
