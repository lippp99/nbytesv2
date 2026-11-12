"use client";

import { useEffect, useState } from "react";
import { appFocus } from "@/components/app-kit/button";
import { cn } from "@/lib/utils";

const link = `block shrink-0 py-3.5 text-app-ui whitespace-nowrap transition-colors duration-150 ${appFocus}`;

/**
 * Section bar under the sticky header (top-16) that marks the section being read (R1): the last section whose top
 * passed the upper third. It scrolls sideways on narrow screens; it is navigation, not content.
 */
export function DocsToc({ label, items }: { label: string; items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const sections = items.flatMap((i) => document.getElementById(i.id) ?? []);
    const observer = new IntersectionObserver(() => {
      const passed = sections.filter((s) => s.getBoundingClientRect().top < window.innerHeight / 3);
      setActive(passed.at(-1)?.id ?? items[0]?.id);
    }, { rootMargin: "0px 0px -66% 0px" });
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label={label} className="sticky top-16 z-20 border-b border-app-border bg-app-page">
      <ul className="flex gap-6 overflow-x-auto">
        {items.map((t) => (
          <li key={t.id} className="shrink-0">
            <a href={`#${t.id}`} aria-current={active === t.id ? "location" : undefined}
              className={cn(link, active === t.id
                ? "font-medium text-app-text shadow-[inset_0_-2px_0_var(--app-text)]"
                : "text-app-text-2 hover:text-app-text")}>
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
