import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { cn } from "@/lib/utils";

export type StepState = "done" | "current" | "todo";
export type SetupStep = {
  title: string;
  body: string;
  state: StepState;
  action?: { href: string; label: string };
  content?: ReactNode;
};

const actionLink = `group ml-auto inline-flex items-center gap-1 rounded-sm text-sm font-medium text-accent-ink ${focusRing}`;

const marker: Record<StepState, string> = {
  done: "bg-success/12 text-success",
  current: "bg-accent-mark text-accent-mark-foreground ring-4 ring-accent-soft",
  todo: "border border-border bg-background text-muted-foreground",
};

function StepMarker({ state, n }: { state: StepState; n: number }) {
  return (
    <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full font-mono text-sm", marker[state])}>
      {state === "done" ? <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-4" /> : n}
    </span>
  );
}

/** Vertical checklist joined by a rail; the current step opens up with its content, finished ones stay one line. */
export function SetupSteps({ steps, doneLabel }: { steps: SetupStep[]; doneLabel: string }) {
  return (
    <ol>
      {steps.map((step, i) => (
        <li key={step.title} aria-current={step.state === "current" ? "step" : undefined} className="relative flex gap-4 pb-8 last:pb-0">
          {i < steps.length - 1 && <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-border" />}
          <StepMarker state={step.state} n={i + 1} />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className={cn("font-medium", step.state === "done" && "text-muted-foreground")}>{step.title}</h2>
              {step.state === "done" && <span className="rounded-full bg-success/12 px-2 py-0.5 text-xs text-success">{doneLabel}</span>}
              {step.action && (
                <Link href={step.action.href} className={actionLink}>
                  {step.action.label}
                  <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            {step.content && <div className="mt-5">{step.content}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
