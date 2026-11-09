import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/ui/arrow-right";
import { secondaryButton } from "@/components/button-styles";
import { AgentConnect } from "./agent-connect";
import { actions, agents } from "../shared/landing-copy";
import { Hl, Section } from "../shared/section";

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
            <ArrowRightIcon />
          </a>
          <Link href="/login" className={secondaryButton("h-9.5 px-4 text-ui")}>
            {actions.getKey}
            <ArrowRightIcon />
          </Link>
        </div>
      }
    >
      <AgentConnect />
    </Section>
  );
}
