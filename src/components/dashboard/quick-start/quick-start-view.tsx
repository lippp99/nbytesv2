import { account, apiKeys } from "@/components/dashboard/shared/dashboard-data";
import { QuickStartAside } from "./quick-start-aside";
import { quickStartCopy as copy } from "./quick-start-copy";
import { RequestBuilder } from "./request-builder";
import { type SetupStep, SetupSteps } from "./setup-steps";
import { WelcomeBanner } from "./welcome-banner";

// Mock progress: the account exists and has keys, the first request is the open step.
const steps: SetupStep[] = [
  { ...copy.steps.account, body: copy.steps.account.body(account.email), state: "done" },
  {
    ...copy.steps.key,
    state: apiKeys.length > 0 ? "done" : "current",
    action: { href: "/api-keys", label: copy.steps.key.action },
  },
  { ...copy.steps.request, state: "current", content: <RequestBuilder /> },
  { ...copy.steps.monitor, state: "todo", action: { href: "/usage", label: copy.steps.monitor.action } },
];

export function QuickStartView() {
  const done = steps.filter((s) => s.state === "done").length;
  return (
    <>
      <WelcomeBanner done={done} total={steps.length} />
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="min-w-0 lg:col-span-8">
          <SetupSteps steps={steps} doneLabel={copy.done} />
        </div>
        <aside className="lg:col-span-4">
          <QuickStartAside />
        </aside>
      </div>
    </>
  );
}
