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
  /** Fact shown after "Selesai" on a finished step (the email, the key count). */
  note?: string;
  action?: { href: string; label: string };
  content?: ReactNode;
};

type StepLabels = { done: string; current: string };

const marker: Record<StepState, string> = {
  done: "border border-app-border bg-app-surface text-app-success",
  current: "bg-app-accent text-app-on-accent ring-4 ring-app-accent-soft",
  todo: "border border-app-border-strong bg-app-surface text-app-text-3",
};

function StepMarker({ state, n }: { state: StepState; n: number }) {
  return (
    <span className={cn("relative z-10 grid size-7 shrink-0 place-items-center rounded-full font-mono text-app-small", marker[state])}>
      {state === "done" ? <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-4" /> : n}
    </span>
  );
}

function StepAction({ action }: { action: SetupStep["action"] }) {
  if (!action) return null;
  return (
    <Link href={action.href} className={ghostAction("-my-1 ml-auto", "sm")}>
      {action.label}
      <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
    </Link>
  );
}

/** Finished: one quiet line with "Selesai", its fact and the way back to it. */
function DoneStep({ step, labels }: { step: SetupStep; labels: StepLabels }) {
  return (
    <div className="flex min-h-7 min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
      <h3 className="text-app-ui font-medium text-app-text-2">{step.title}</h3>
      <span className="text-app-small text-app-text-3">{step.note ? `${labels.done} · ${step.note}` : labels.done}</span>
      <StepAction action={step.action} />
    </div>
  );
}

/** Current opens with its body, action and content; a later step is a dim title with a short body (D: design A). */
function OpenStep({ step, labels }: { step: SetupStep; labels: StepLabels }) {
  const current = step.state === "current";
  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className={cn("text-app-ui text-app-text", current ? "font-semibold" : "font-medium")}>{step.title}</h3>
        {current && <span className="text-app-small text-app-text-3">{labels.current}</span>}
        {current && <StepAction action={step.action} />}
      </div>
      <p className={cn("mt-1 max-w-prose", current ? "text-app-ui text-app-text-2" : "text-app-small text-app-text-3")}>{step.body}</p>
      {step.content && <div className="mt-4">{step.content}</div>}
    </div>
  );
}

/** Checklist on a rail; the current step opens with its content, finished ones stay one quiet line. */
export function SetupSteps({ steps, labels }: { steps: SetupStep[]; labels: StepLabels }) {
  return (
    <ol className="space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} aria-current={step.state === "current" ? "step" : undefined} className="relative flex gap-4">
          {i < steps.length - 1 && <span aria-hidden className="absolute top-7 -bottom-5 left-3.5 w-px -translate-x-1/2 bg-app-border" />}
          <StepMarker state={step.state} n={i + 1} />
          {step.state === "done" ? <DoneStep step={step} labels={labels} /> : <OpenStep step={step} labels={labels} />}
        </li>
      ))}
    </ol>
  );
}
