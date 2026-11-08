import { Activity, BookOpen, Boxes, KeyRound, PanelLeft, Settings, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboard } from "./landing-copy";

const icons = [Boxes, Activity, KeyRound, Wallet, ShieldCheck];
const bottomIcons = [BookOpen, Settings];
const item = "flex h-9 items-center gap-3 rounded-chip px-3 text-sm";

export function DashboardSidebar() {
  return (
    <div className="hidden flex-col p-3 lg:col-span-3 lg:flex">
      <div className="flex h-10 items-center justify-between px-3">
        <span className="font-mono text-sm font-medium">nbytes</span>
        <PanelLeft aria-hidden className="size-4 text-muted-foreground" />
      </div>
      <ul className="mt-4 space-y-0.5">
        {dashboard.nav.map((entry, i) => {
          const Icon = icons[i];
          return (
            <li key={entry.label} className={cn(item, entry.active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
              <Icon aria-hidden className="size-4" />
              <span className="flex-1">{entry.label}</span>
              {entry.count && <span className="font-mono text-label">{entry.count}</span>}
            </li>
          );
        })}
      </ul>
      <ul className="mt-auto space-y-0.5 pt-10">
        {dashboard.navBottom.map((label, i) => {
          const Icon = bottomIcons[i];
          return (
            <li key={label} className={cn(item, "text-muted-foreground")}>
              <Icon aria-hidden className="size-4" />
              {label}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center gap-3 border-t border-border px-3 pt-4">
        <span className="grid size-8 place-items-center rounded-chip bg-accent-mark font-medium text-accent-mark-foreground">T</span>
        <span className="text-sm leading-tight">
          {dashboard.org.name}
          <span className="block text-muted-foreground">{dashboard.org.plan}</span>
        </span>
      </div>
    </div>
  );
}
