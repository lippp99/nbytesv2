import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ghostAction } from "@/components/app-kit/button";
import { cn } from "@/lib/utils";
import type { StepState } from "./quick-start-data";

export type SetupStep = {
  title: string;
  body: string;
  state: StepState;
  action?: { href: string; label: string };
  content?: ReactNode;
};

const marker: Record<StepState, string> = {
  done: "border border-app-border bg-app-surface text-app-success",
  current: "bg-app-accent text-app-on-accent",
  todo: "border border-app-border-strong bg-app-surface text-app-text-3",
};

function StepMarker({ state, n }: { state: StepState; n: number }) {
  return (
    <span className={cn("relative z-10 grid size-7 shrink-0 place-items-center rounded-full font-mono text-app-small", marker[state])}>
      {state === "done" ? <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-4" /> : n}
    </span>
  );
}

/** Checklist on a rail; the current step opens with its content, finished ones stay one quiet line. */
export function SetupSteps({ steps, doneLabel }: { steps: SetupStep[]; doneLabel: string }) {
  return (
    <ol>
      {steps.map((step, i) => (
        <li key={step.title} aria-current={step.state === "current" ? "step" : undefined} className="relative flex gap-4 pb-8 last:pb-0">
          {i < steps.length - 1 && <span aria-hidden className="absolute top-7 bottom-0 left-3.5 w-px -translate-x-1/2 bg-app-border" />}
          <StepMarker state={step.state} n={i + 1} />
          <div className="min-w-0 flex-1">
            <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className={cn("text-app-ui font-medium", step.state === "done" ? "text-app-text-2" : "text-app-text")}>{step.title}</h3>
              {step.state === "done" && <span className="sr-only">{doneLabel}</span>}
              {step.action && (
                <Link href={step.action.href} className={ghostAction("-my-1 ml-auto", "sm")}>
                  {step.action.label}
                  <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
                </Link>
              )}
            </div>
            <p className="mt-1 text-app-ui text-app-text-2">{step.body}</p>
            {step.content && <div className="mt-5">{step.content}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
