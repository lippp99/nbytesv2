import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page frame: 1112px content (jatevo .wrap 1144px with 16px padding) with dashed guide lines on its edges from 640px up (both references draw these). */
export const frame =
  "relative mx-auto w-full max-w-frame px-4 sm:border-x sm:border-dashed sm:border-guide";

/** Small dots where a section rule meets the guide lines. */
const dots =
  "sm:before:absolute sm:before:-top-0.75 sm:before:-left-0.75 sm:before:size-1.5 sm:before:rounded-full sm:before:bg-faint " +
  "sm:after:absolute sm:after:-top-0.75 sm:after:-right-0.75 sm:after:size-1.5 sm:after:rounded-full sm:after:bg-faint";

export const sectionPad = "pt-16 pb-18 lg:pt-24 lg:pb-26";

/** Stagger index for load and reveal animations (80ms per step). */
export const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

export function Hl({ children, delay }: { children: ReactNode; delay?: string }) {
  return (
    <span className="hl" style={delay ? ({ "--delay": delay } as CSSProperties) : undefined}>
      {children}
    </span>
  );
}

type SectionProps = {
  id: string;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  /** Header in a left column next to the content on desktop. */
  split?: boolean;
  className?: string;
  children: ReactNode;
};

export function Section({ id, title, lead, action, split, className, children }: SectionProps) {
  const headingId = `${id}-judul`;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("border-t border-dashed border-guide", className)}>
      <div className={cn(frame, dots, sectionPad, split && "lg:grid lg:grid-cols-12 lg:gap-16")}>
        <header data-reveal className={cn("flex flex-wrap items-end justify-between gap-6", split && "lg:col-span-5 lg:block")}>
          <div>
            <h2 id={headingId} className="max-w-3xl text-h2 text-balance">
              {title}
            </h2>
            {lead && <div className="mt-3 max-w-prose text-lead text-muted-foreground text-pretty">{lead}</div>}
          </div>
          {action}
        </header>
        <div className={cn("mt-8", split && "lg:col-span-7 lg:mt-0")}>{children}</div>
      </div>
    </section>
  );
}
