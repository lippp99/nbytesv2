import { ProviderLogo } from "@/components/provider-logo";
import { formatMicros } from "@/lib/price-format";
import { mockBudget, mockTags } from "./dashboard-mock-data";
import { features } from "./landing-copy";
import { mockProviders } from "@/lib/model-catalog";
import { stagger } from "./section";

// Small product-UI examples inside the feature bento, instead of icons.
const logoCell = "grid h-14 place-items-center transition-transform duration-300 ease-out-expo hover:-translate-y-1 sm:h-18";

export function TagsView() {
  const cols = features.tags.cols;
  return (
    <div>
      <code className="inline-block border border-border bg-background px-3 py-2 font-mono text-code">
        {'X-Nbytes-Tags: {"customer":"acct_1042"}'}
      </code>
      <table className="mt-6 w-full text-sm">
        <thead className="text-muted-foreground">
          <tr className="border-b border-border text-left">
            <th scope="col" className="py-2 font-normal">{cols.customer}</th>
            <th scope="col" className="py-2 text-right font-normal">{cols.requests}</th>
            <th scope="col" className="py-2 text-right font-normal">{cols.cost}</th>
          </tr>
        </thead>
        <tbody className="font-mono text-code tabular-nums">
          {mockTags.map((row, i) => (
            <tr key={row.customer} data-reveal style={stagger(i + 1)} className="border-b border-border last:border-b-0">
              <td className="py-3">{row.customer}</td>
              <td className="py-3 text-right">{row.requests.toLocaleString("en-US")}</td>
              <td className="py-3 text-right">{formatMicros(row.costMicros)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BudgetView() {
  return (
    <ul data-reveal className="space-y-5">
      {mockBudget.map((key) => {
        const pct = Math.min(100, Math.round((key.usedMicros / key.limitMicros) * 100));
        return (
          <li key={key.keyName}>
            <div className="flex justify-between gap-4 font-mono text-code tabular-nums">
              <span>{key.keyName}</span>
              <span className="text-muted-foreground">
                {formatMicros(key.usedMicros)} {features.budget.of} {formatMicros(key.limitMicros)}
              </span>
            </div>
            <div
              role="meter"
              aria-label={key.keyName}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="mt-2 flex h-3 gap-px bg-background p-0.5"
            >
              <div className={`reveal-bar h-full ${pct >= 80 ? "bg-destructive" : "bg-foreground"}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function LogoGridView() {
  return (
    <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5 sm:gap-4">
      {mockProviders.map((p, i) => (
        <li key={p.id} data-reveal style={stagger(i)} className="grid place-items-center">
          {/* logos straight on the orange card, in the card's white text colour */}
          <span className={logoCell}>
            <ProviderLogo icon={p.icon} label={p.name} className="size-9 sm:size-11" />
          </span>
        </li>
      ))}
    </ul>
  );
}
