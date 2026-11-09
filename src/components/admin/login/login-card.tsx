import type { ReactNode } from "react";
import { LockIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { loginCopy } from "./login-copy";

const copy = loginCopy.stepper;

/** Three steps across the card top: done (success), current (accent), next (muted). A word always names the state. */
function Stepper({ current }: { current: number }) {
  return (
    <ol aria-label={copy.label} className="grid grid-cols-3 border-b border-app-border px-5 sm:px-8">
      {copy.steps.map((name, i) => {
        const state = i < current ? "done" : i === current ? "current" : "next";
        return (
          <li key={name} aria-current={state === "current" ? "step" : undefined}
            className={cn("-mb-px flex min-w-0 flex-col gap-1 border-b-2 pt-4 pb-3.5 [&:not(:first-child)]:pl-3",
              state === "done" && "border-app-success", state === "current" && "border-app-accent",
              state === "next" && "border-transparent")}>
            <span className={cn("flex items-center gap-1 text-app-small font-medium",
              state === "done" ? "text-app-success" : state === "current" ? "text-app-accent-text" : "text-app-text-3")}>
              {state === "done" && <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-3.5" />}
              {copy[state]}
            </span>
            {/* phones drop the number and step down a size so "Authenticator" fits a third of a 320px card */}
            <span className={cn("text-app-small break-words sm:text-app-ui", state === "current" ? "font-semibold text-app-text" : "text-app-text-2")}>
              <span className="hidden sm:inline">{i + 1}. </span>{name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

type LoginCardProps = { step: number; footerAction?: ReactNode; children: ReactNode };

/** Design B: one flat card with the stepper on top, the step's form, and a quiet strip with the way back. */
export function LoginCard({ step, footerAction, children }: LoginCardProps) {
  return (
    <div className="overflow-hidden rounded-app-card border border-app-border bg-app-surface">
      <Stepper current={step} />
      <div className="px-5 py-7 sm:px-8 sm:py-8">{children}</div>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-app-border bg-app-inset px-5 py-2 sm:px-8">
        <div>{footerAction}</div>
        <span className="inline-flex items-center gap-1.5 text-app-small text-app-text-2">
          <HugeiconsIcon icon={LockIcon} aria-hidden className="size-3.5" />
          {loginCopy.lockNote}
        </span>
      </div>
    </div>
  );
}
