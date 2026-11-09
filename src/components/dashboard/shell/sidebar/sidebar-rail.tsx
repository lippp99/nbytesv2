import Image from "next/image";
import Link from "next/link";
import { account } from "@/components/dashboard/shared/dashboard-data";
import { appFocus } from "@/components/app-kit/button";
import { ThemeSwitch } from "@/components/app-kit/theme-switch";
import { cn } from "@/lib/utils";
import monogram from "../../../../../public/brand/nb-orange.png";
import { ProfileIcon } from "@/components/icons/content/profile";
import { RocketIcon } from "@/components/icons/content/rocket";
import { AppsIcon } from "@/components/icons/content/apps";
import { LogoutIcon } from "@/components/icons/ui/logout";
import { type NavGroupIcon, navGroups } from "../nav-items";
import { shellCopy } from "../shell-copy";
import { LogoutForm } from "./logout-form";

const initials = account.userName.split(" ").map((part) => part[0]).slice(0, 2).join("");
const tile =
  "group relative grid size-10 place-items-center rounded-app-control transition-colors duration-150 [&_svg]:size-5 " +
  appFocus;
// The open group is the one solid accent tile in the sidebar (white icon on #c2410c, 5.18:1).
const open = "bg-app-accent text-app-on-accent";
const idle = "text-app-text-2 hover:bg-app-hover hover:text-app-text";
// The rail is icons only, so every icon names itself on hover and keyboard focus.
const tip =
  "pointer-events-none absolute top-1/2 left-full z-50 ml-3 hidden -translate-y-1/2 rounded-app-inner bg-app-text px-2 py-1 " +
  "text-app-small whitespace-nowrap text-app-surface shadow-app-raised group-hover:block group-focus-visible:block";

const groupIcons = { rocket: RocketIcon, apps: AppsIcon, profile: ProfileIcon };

function GroupIcon({ name }: { name: NavGroupIcon }) {
  const Icon = groupIcons[name];
  return <Icon />;
}

type SidebarRailProps = { group: number; panelId: string; onPick: (index: number) => void };

/**
 * First tier: home mark, one icon per menu group, and the account avatar at the foot (theme switch above it). When the
 * desktop sidebar is folded (the panel with its sign-out is hidden), sign-out appears under the avatar.
 */
export function SidebarRail({ group, panelId, onPick }: SidebarRailProps) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center pb-4">
      <Link href="/" aria-label={shellCopy.home} className={cn("my-4.5 rounded-app-inner", appFocus)}>
        <Image src={monogram} alt="" sizes="28px" className="size-7" />
      </Link>
      <div role="group" aria-label={shellCopy.groupsLabel} className="flex flex-col gap-1.5">
        {navGroups.map((item, i) => (
          <button key={item.label} type="button" onClick={() => onPick(i)} aria-pressed={i === group} aria-controls={panelId}
            aria-label={item.label} className={cn(tile, i === group ? open : idle)}>
            <GroupIcon name={item.icon} />
            <span aria-hidden className={tip}>{item.label}</span>
          </button>
        ))}
      </div>
      {/* the theme switch lives here, not in the header, on every screen size (owner, 2026-11-09) */}
      <ThemeSwitch label={shellCopy.darkMode} className="mt-auto mb-3 size-10" />
      <Link href="/settings" aria-label={shellCopy.account} className={cn("group relative rounded-full", appFocus)}>
        <span aria-hidden className="grid size-8 place-items-center rounded-full border border-app-border bg-app-surface text-app-small font-medium text-app-text-2">
          {initials}
        </span>
        <span aria-hidden className={tip}>{account.userName}</span>
      </Link>
      <LogoutForm className={cn(tile, idle, "mt-2 hidden cursor-pointer rail:grid")}>
        <LogoutIcon />
        <span aria-hidden className={tip}>{shellCopy.signOut}</span>
      </LogoutForm>
    </div>
  );
}
