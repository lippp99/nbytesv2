import { ProviderLogo } from "@/components/provider-logo";
import { cn } from "@/lib/utils";
import { hero } from "./landing-copy";
import { modelById } from "@/lib/model-catalog";
import { frame, stagger } from "./section";

const featured = ["gpt-5", "claude-sonnet-4.5", "deepseek-v3.2"];
const cell = "flex h-14 shrink-0 items-center gap-3 border-r border-dashed border-guide px-4 sm:px-6 md:flex-1";

// Bordered row of headline models under the hero, a quiet bridge to the dashboard below.
export function ModelStrip() {
  return (
    <div className="border-y border-dashed border-guide">
      <ul className={cn(frame, "flex overflow-x-auto scrollbar-none px-0 sm:px-0 lg:px-0")}>
        <li className={cn(cell, "text-sm text-muted-foreground")}>{hero.strip.label}</li>
        {featured.map((id, i) => {
          const model = modelById(id);
          if (!model) return null;
          return (
            <li key={id} data-reveal style={stagger(i)} className={cn(cell, "text-ui")}>
              <ProviderLogo icon={model.icon} className="size-5" />
              <span className="whitespace-nowrap">{model.name}</span>
            </li>
          );
        })}
        <li className={cn(cell, "border-r-0 text-sm text-muted-foreground md:justify-end")}>
          <a href="#model" className="whitespace-nowrap underline-offset-4 hover:underline">{hero.strip.more}</a>
        </li>
      </ul>
    </div>
  );
}
