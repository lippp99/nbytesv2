import Link from "next/link";
import { ArrowRight01Icon, BookOpen01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ghostAction, primaryAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import type { CatalogModel } from "@/lib/gateway/catalog-contract";
import { cn } from "@/lib/utils";
import { QuickStartAside } from "./quick-start-aside";
import { quickStartCopy as copy } from "./quick-start-copy";
import { STEP_ORDER, type SetupProgress, type StepId, type StepState, stepStates } from "./quick-start-data";
import { RequestBuilder } from "./request-builder";
import { type SetupStep, SetupSteps } from "./setup-steps";

export type QuickStartData = {
  name: string; email: string; progress: SetupProgress; keyCount: number; modelCount: number; cheapest: CatalogModel[];
  baseUrl: string;
};

function buildSteps(data: QuickStartData, states: Record<StepId, StepState>): SetupStep[] {
  const s = copy.steps;
  const steps: Record<StepId, Omit<SetupStep, "state">> = {
    account: { title: s.account.title, body: s.account.body(data.email), note: data.email },
    key: { ...s.key, note: copy.keyNote(data.keyCount), action: { href: "/api-keys", label: s.key.action } },
    balance: { ...s.balance, action: { href: "/billing", label: s.balance.action } },
    // The builder stays visible until the first request is done, so a new user sees what the code will look like.
    request: { ...s.request, content: <RequestBuilder models={data.cheapest} baseUrl={data.baseUrl} /> },
    budget: { ...s.budget, action: { href: "/api-keys", label: s.budget.action } },
  };
  return STEP_ORDER.map((id) => ({ ...steps[id], state: states[id], content: states[id] === "done" ? undefined : steps[id].content }));
}

const segment: Record<StepState, string> = { done: "bg-app-success", current: "bg-app-accent", todo: "bg-app-border" };

/** "N dari 5 selesai" with one segment per step: finished in the success tone (D3), the current one in accent (selection). */
function Progress({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((s) => s.state === "done").length;
  return (
    <div className="flex items-center gap-3">
      <span className="text-app-small text-app-text-2">{copy.progress(done, steps.length)}</span>
      <span role="progressbar" aria-label={copy.setup} aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done}
        className="flex w-30 gap-1">
        {steps.map((s) => <span key={s.title} className={cn("h-1 flex-1 rounded-full", segment[s.state])} />)}
      </span>
    </div>
  );
}

/** F3: every step done, so the checklist shrinks to one line and points at Usage. */
function AllDone() {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-4 p-6">
        <HugeiconsIcon icon={Tick02Icon} aria-hidden className="size-5 shrink-0 text-app-success" />
        <div className="min-w-0 flex-1">
          <h2 className="text-app-card text-app-text">{copy.allDone.title}</h2>
          <p className="mt-1 text-app-ui text-app-text-2">{copy.allDone.body}</p>
        </div>
        <Link href="/usage" className={ghostAction("", "sm")}>
          {copy.allDone.action}
          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
        </Link>
      </div>
    </Card>
  );
}

export function QuickStartView({ data }: { data: QuickStartData }) {
  const steps = buildSteps(data, stepStates(data.progress));
  const allDone = steps.every((s) => s.state === "done");
  const actions = (
    <>
      <Link href="/docs" className={secondaryAction()}>
        <HugeiconsIcon icon={BookOpen01Icon} aria-hidden />
        {copy.openDocs}
      </Link>
      <Link href="/playground" className={primaryAction()}>
        {copy.tryPlayground}
        <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden />
      </Link>
    </>
  );
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub(data.name)} action={actions} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 lg:self-start">
          {allDone ? <AllDone /> : (
            <Card title={copy.setup} headerClassName="bg-app-inset" action={<Progress steps={steps} />}>
              <div className="p-6">
                <SetupSteps steps={steps} labels={copy} />
              </div>
            </Card>
          )}
        </div>
        <aside>
          <QuickStartAside baseUrl={data.baseUrl} keyCount={data.keyCount} modelCount={data.modelCount} cheapest={data.cheapest} />
        </aside>
      </div>
    </>
  );
}
