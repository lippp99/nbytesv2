import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FallbackCycle } from "./fallback-cycle";
import { BudgetView, LogoGridView, TagsView } from "./feature-views";
import { features } from "../shared/landing-copy";
import { Hl, Section, stagger } from "../shared/section";

type CardProps = { title: string; body: string; tone: string; className: string; i: number; children: ReactNode };

function Card({ title, body, tone, className, i, children }: CardProps) {
  return (
    <li data-reveal style={stagger(i)} className={cn("flex flex-col gap-6 p-5 sm:p-6 lg:p-8", tone, className)}>
      <div>
        <h3 className="text-h3">{title}</h3>
        <p className="mt-2 max-w-md text-sm opacity-75">{body}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </li>
  );
}

// Bento of four gateway features, each with a small working piece of product UI.
export function FeaturesSection() {
  return (
    <Section id="fitur" title={<>{features.titleBefore} <Hl>{features.titleMark}</Hl>{features.titleAfter}</>}>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <Card i={0} {...features.tags} tone="bg-muted" className="md:col-span-7">
          <TagsView />
        </Card>
        <Card i={1} {...features.fallback} tone="dark bg-ink-panel text-foreground" className="md:col-span-5">
          <FallbackCycle />
        </Card>
        <Card i={2} {...features.budget} tone="bg-muted" className="md:col-span-5">
          <BudgetView />
        </Card>
        <Card i={3} {...features.oneKey} tone="bg-accent-mark text-accent-mark-foreground" className="md:col-span-7">
          <LogoGridView />
        </Card>
      </ul>
    </Section>
  );
}
