"use client";

import { useEffect } from "react";

/**
 * Scroll reveal for `[data-reveal]` (fade + rise + un-blur, staggered by the `--i` style variable).
 * Items start visible; only this script hides the ones still below the fold, so content shows without JS.
 * `data-reveal="step"` waits until the item is a quarter up the screen (one list row per bit of scroll).
 * Every shown item gets `data-revealed`, which lets the animations inside it run (see globals.css). `data-play-on-view`
 * marks a block that is not faded in but whose animations wait until half of it is on screen (the setup code box).
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reveal: IntersectionObserverCallback = (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("is-pending");
        (entry.target as HTMLElement).dataset.revealed = "";
        observer.unobserve(entry.target);
      }
    };
    const observer = new IntersectionObserver(reveal, { rootMargin: "0px 0px -8% 0px" });
    // data-reveal="step": shows only once it is a quarter up the screen, so each bit of scroll brings in one more item
    const step = new IntersectionObserver(reveal, { rootMargin: "0px 0px -25% 0px" });
    const play = new IntersectionObserver(reveal, { threshold: 0.5 });
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      const isStep = el.dataset.reveal === "step";
      if (el.getBoundingClientRect().top < window.innerHeight * (isStep ? 0.75 : 0.92)) {
        el.dataset.revealed = "";
        continue;
      }
      el.classList.add("is-pending");
      (isStep ? step : observer).observe(el);
    }
    for (const el of document.querySelectorAll<HTMLElement>("[data-play-on-view]")) play.observe(el);
    return () => {
      observer.disconnect();
      step.disconnect();
      play.disconnect();
    };
  }, []);

  return null;
}
