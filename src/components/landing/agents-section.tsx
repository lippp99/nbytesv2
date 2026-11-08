import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { secondaryButton } from "@/components/button-styles";
import { AgentConnect } from "./agent-connect";
import { actions, agents } from "./landing-copy";
import { Hl, Section } from "./section";

export function AgentsSection() {
  return (
    <Section
      id="agen"
      title={<>{agents.titleBefore} <Hl>{agents.titleMark}</Hl>{agents.titleAfter}</>}
      lead={agents.lead}
      action={
        <div className="flex flex-wrap gap-2">
          <a href="#model" className={secondaryButton("h-9.5 px-4 text-ui")}>
            {agents.seeModels}
            <ChevronRightIcon aria-hidden />
          </a>
          <Link href="/login" className={secondaryButton("h-9.5 px-4 text-ui")}>
            {actions.getKey}
            <ChevronRightIcon aria-hidden />
          </Link>
        </div>
      }
    >
      <AgentConnect />
    </Section>
  );
}
