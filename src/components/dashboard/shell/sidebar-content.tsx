import Link from "next/link";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { account } from "@/components/dashboard/shared/dashboard-data";
import { Wordmark } from "@/components/wordmark";
import { shellCopy } from "./shell-copy";
import { SidebarNav } from "./sidebar-nav";
import { UsageMeter } from "./usage-meter";

const initials = (name: string) => name.split(" ").map((part) => part[0]).slice(0, 2).join("");

/** Everything inside the sidebar; rendered by the desktop sidebar and by the mobile sheet. */
export function SidebarContent() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <Wordmark />
      </div>
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-chip bg-accent-mark font-heading text-accent-mark-foreground">
          {account.name.charAt(0)}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-medium">{account.name}</span>
          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{account.plan}</span>
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        <SidebarNav />
      </div>
      <div className="space-y-3 border-t border-border p-3">
        <UsageMeter />
        <div className="flex items-center gap-3 px-1">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-xs font-medium text-background">
            {initials(account.userName)}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm">{account.userName}</span>
            <span className="block truncate text-xs text-muted-foreground">{account.email}</span>
          </span>
          <Link
            href="/login"
            aria-label={shellCopy.signOut}
            title={shellCopy.signOut}
            className={`grid size-9 shrink-0 place-items-center rounded-chip text-muted-foreground hover:bg-muted hover:text-foreground ${focusRing}`}
          >
            <HugeiconsIcon icon={Logout01Icon} aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
