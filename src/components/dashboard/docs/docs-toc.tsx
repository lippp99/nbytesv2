"use client";

import { useEffect, useState } from "react";
import { appFocus } from "@/components/app-kit/button";
import { cn } from "@/lib/utils";

const link = `-ml-px block border-l py-1.5 pl-4 text-app-ui transition-colors ${appFocus}`;

/** On-page index that marks the section being read (R1): the last section whose top passed the upper third. */
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
    <nav aria-label={label} className="sticky top-24">
      <p className="text-app-small font-medium text-app-text-3">{label}</p>
      <ul className="mt-3 border-l border-app-border">
        {items.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`} aria-current={active === t.id ? "location" : undefined}
              className={cn(link, active === t.id
                ? "border-app-text font-medium text-app-text"
                : "border-transparent text-app-text-2 hover:border-app-border-strong hover:text-app-text")}>
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
