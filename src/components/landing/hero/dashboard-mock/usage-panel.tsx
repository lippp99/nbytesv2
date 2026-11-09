import { formatMicros } from "@/lib/price-format";
import { cn } from "@/lib/utils";
import { mockUsage } from "../../shared/dashboard-mock-data";
import { dashboard } from "../../shared/landing-copy";

// Monochrome series plus the accent, so the panel stays inside the one-accent palette.
const swatches = ["bg-foreground", "bg-accent-mark", "bg-muted-foreground", "bg-faint", "bg-guide"];
const totalRequests = mockUsage.reduce((sum, row) => sum + row.requests, 0);
const totalCost = mockUsage.reduce((sum, row) => sum + row.costMicros, 0);
const copy = dashboard.usage;

export function UsagePanel() {
  return (
    <div className="hidden overflow-hidden rounded-panel border border-border md:col-span-5 md:block">
      <p className="border-b border-border px-4 py-3 text-sm font-medium">{copy.title}</p>
      <div className="px-4 pt-4">
        <div data-reveal className="flex h-2 gap-0.5">
          {mockUsage.map((row, i) => (
            <span
              key={row.modelId}
              className={cn("reveal-bar h-full rounded-full", swatches[i])}
              style={{ width: `${(row.requests / totalRequests) * 100}%` }}
            />
          ))}
        </div>
      </div>
      <table className="mt-2 w-full table-fixed text-sm">
        <thead className="text-muted-foreground">
          <tr className="text-left">
            <th scope="col" className="py-2 pl-4 font-normal">{dashboard.history.model}</th>
            <th scope="col" className="w-24 py-2 text-right font-normal">{copy.requests}</th>
            <th scope="col" className="w-20 py-2 pr-4 text-right font-normal">{copy.cost}</th>
          </tr>
        </thead>
        <tbody className="font-mono text-code tabular-nums">
          {mockUsage.map((row, i) => (
            <tr key={row.modelId} className="border-t border-border">
              <td className="py-2 pl-4">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("size-2 shrink-0 rounded-full", swatches[i])} />
                  <span className="truncate">{row.modelId}</span>
                </span>
              </td>
              <td className="py-2 text-right">{row.requests.toLocaleString("en-US")}</td>
              <td className="py-2 pr-4 text-right">{formatMicros(row.costMicros)}</td>
            </tr>
          ))}
          <tr className="border-t border-border bg-muted font-sans font-medium">
            <td className="py-2 pl-4">{copy.total}</td>
            <td className="py-2 text-right font-mono">{totalRequests.toLocaleString("en-US")}</td>
            <td className="py-2 pr-4 text-right font-mono">{formatMicros(totalCost)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
