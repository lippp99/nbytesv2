import Link from "next/link";
import { BookOpen01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { account, apiKeys } from "@/components/dashboard/shared/dashboard-data";
import { primaryAction, secondaryAction } from "@/components/app-kit/button";
import { Card } from "@/components/app-kit/card";
import { PageHeader } from "@/components/app-kit/page-header";
import { cn } from "@/lib/utils";
import { QuickStartAside } from "./quick-start-aside";
import { quickStartCopy as copy } from "./quick-start-copy";
import { RequestBuilder } from "./request-builder";
import { type SetupStep, SetupSteps } from "./setup-steps";

// Mock progress: the account exists and has keys, the first request is the open step.
const steps: SetupStep[] = [
  { ...copy.steps.account, body: copy.steps.account.body(account.email), state: "done" },
  { ...copy.steps.key, state: apiKeys.length > 0 ? "done" : "current", action: { href: "/api-keys", label: copy.steps.key.action } },
  { ...copy.steps.request, state: "current", content: <RequestBuilder /> },
  { ...copy.steps.monitor, state: "todo", action: { href: "/usage", label: copy.steps.monitor.action } },
];

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-app-small text-app-text-2">{copy.progress(done, total)}</span>
      <span aria-hidden className="flex w-24 gap-1">
        {steps.map((s) => (
          <span key={s.title} className={cn("h-1 flex-1 rounded-full", s.state === "done" ? "bg-app-accent" : "bg-app-border")} />
        ))}
      </span>
    </div>
  );
}

export function QuickStartView() {
  const done = steps.filter((s) => s.state === "done").length;
  const actions = (
    <>
      <Link href="/docs" className={secondaryAction()}>
        <HugeiconsIcon icon={BookOpen01Icon} aria-hidden />
        {copy.openDocs}
      </Link>
      <Link href="/api-keys" className={primaryAction()}>
        <HugeiconsIcon icon={PlusSignIcon} aria-hidden />
        {copy.createKey}
      </Link>
    </>
  );
  return (
    <>
      <PageHeader title={copy.title} sub={copy.sub(account.userName.split(" ")[0])} action={actions} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={copy.setup} action={<Progress done={done} total={steps.length} />} className="lg:col-span-2 lg:self-start">
          <div className="p-6">
            <SetupSteps steps={steps} doneLabel={copy.done} />
          </div>
        </Card>
        <aside>
          <QuickStartAside />
        </aside>
      </div>
    </>
  );
}
