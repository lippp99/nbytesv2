import { ProviderLogo } from "@/components/provider-logo";
import { formatMicros } from "@/lib/price-format";
import { models as copy } from "./landing-copy";
import { capabilityLabels, type Model, providerById } from "@/lib/model-catalog";
import { formatContext } from "@/lib/model-format";

// Compact row: ~90px on desktop (was ~150px), ~130px on phones (was ~230px). Name and price figures at 16-18px,
// id and provider chip share one line, capabilities in one small line; the price columns stay 104px and right-aligned.
const rowClass =
  "relative grid grid-cols-1 gap-3 border-b border-dashed border-guide py-4 transition-colors duration-150 " +
  "hover:bg-linear-to-r hover:from-transparent hover:via-muted hover:to-transparent lg:grid-cols-model-row lg:items-center lg:gap-4";

function Figure({ value, label }: { value: string; label: string }) {
  const dollar = value.startsWith("$");
  return (
    <div className="min-w-0">
      <b className="block text-base leading-none font-medium tracking-tight tabular-nums sm:text-lg">
        {dollar && <span className="mr-px align-text-top text-xs font-normal text-muted-foreground">$</span>}
        {dollar ? value.slice(1) : value}
      </b>
      <span className="mt-1 block truncate text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function ModelRow({ model }: { model: Model }) {
  const provider = providerById(model.providerId);
  return (
    <li className={rowClass}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center border border-guide bg-background">
          <ProviderLogo icon={model.icon} label={provider?.name} className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base leading-tight font-medium tracking-tight">{model.name}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-xs text-muted-foreground">{model.id}</span>
            <span className="bg-secondary px-1.5 py-px text-xs text-foreground/80">
              {copy.kind} · {provider?.name}
            </span>
          </p>
          <p className="mt-1.5 hidden text-xs text-muted-foreground sm:block">
            {model.capabilities.map((c) => capabilityLabels[c]).join(" / ")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pl-12 lg:grid-cols-figures lg:gap-4 lg:pl-0 lg:text-right">
        <Figure value={formatMicros(model.inputPerMTokMicros)} label={copy.perInput} />
        <Figure value={formatMicros(model.outputPerMTokMicros)} label={copy.perOutput} />
        <Figure value={formatContext(model.contextTokens)} label={copy.context} />
      </div>
    </li>
  );
}
