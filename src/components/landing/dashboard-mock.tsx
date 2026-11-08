import { CountUp } from "./count-up";
import { DashboardSidebar } from "./dashboard-sidebar";
import { mockStats } from "./dashboard-mock-data";
import { dashboard } from "./landing-copy";
import { LiveLog } from "./live-log";
import { frame, stagger } from "./section";
import { UsagePanel } from "./usage-panel";
import { cn } from "@/lib/utils";

// Product UI as the hero visual (both references do this): a gateway dashboard built in HTML with mock data.
export function DashboardMock() {
  return (
    <div className={cn(frame, "pt-10 pb-16 sm:pt-12 lg:pb-24")}>
      <div
        role="img"
        aria-label={dashboard.label}
        data-reveal
        className="grid rounded-card border border-border bg-muted p-2 shadow-2xl shadow-foreground/5 lg:grid-cols-12"
      >
        <DashboardSidebar />
        <div className="min-w-0 rounded-panel border border-border bg-background p-4 sm:p-6 lg:col-span-9 lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-heading text-h3">{dashboard.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dashboard.sub}</p>
            </div>
            <div className="flex rounded-full border border-border p-0.5 text-sm">
              {dashboard.ranges.map((range, i) => (
                <span
                  key={range}
                  className={cn("rounded-full px-3 py-1.5", i === dashboard.ranges.length - 1 ? "bg-foreground text-background" : "text-muted-foreground")}
                >
                  {range}
                </span>
              ))}
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {mockStats.map((stat, i) => (
              <div key={stat.key} data-reveal style={stagger(i)} className="min-w-0 rounded-panel border border-border p-3 sm:p-4">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 truncate font-mono text-base sm:text-lg">
                  <CountUp value={stat.value} kind={stat.unit} />
                </dd>
                <dd className={cn("mt-1 text-sm", "subTone" in stat ? "text-destructive" : "text-muted-foreground")}>{stat.sub}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
            <UsagePanel />
            <div className="min-w-0 overflow-hidden rounded-panel border border-border md:col-span-7">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-medium">{dashboard.history.title}</p>
                <span className="flex items-center gap-2 font-mono text-label uppercase text-success">
                  <span className="size-1.5 animate-live rounded-full bg-success" />
                  {dashboard.history.live}
                </span>
              </div>
              <LiveLog />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
