import { BookIcon } from "@/components/icons/content/book";
import { CardCheckIcon } from "@/components/icons/content/card-check";
import { CubeIcon } from "@/components/icons/content/cube";
import { LineChartIcon } from "@/components/icons/content/line-chart";
import { SettingsIcon } from "@/components/icons/content/settings";
import { ShieldFilledIcon } from "@/components/icons/content/shield-filled";
import { SidebarIcon } from "@/components/icons/ui/sidebar";
import { KeyIcon } from "@/components/landing/shared/icons/key";
import { cn } from "@/lib/utils";
import { dashboard } from "../../shared/landing-copy";

const icons = [CubeIcon, LineChartIcon, KeyIcon, CardCheckIcon, ShieldFilledIcon];
const bottomIcons = [BookIcon, SettingsIcon];
const item = "flex h-9 items-center gap-3 rounded-chip px-3 text-sm";

export function DashboardSidebar() {
  return (
    <div className="hidden flex-col p-3 lg:col-span-3 lg:flex">
      <div className="flex h-10 items-center justify-between px-3">
        <span className="font-mono text-sm font-medium">nbytes</span>
        <SidebarIcon className="size-4 text-muted-foreground" />
      </div>
      <ul className="mt-4 space-y-0.5">
        {dashboard.nav.map((entry, i) => {
          const Icon = icons[i];
          return (
            <li key={entry.label} className={cn(item, entry.active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
              <Icon className="size-4" />
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
              <Icon className="size-4" />
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
