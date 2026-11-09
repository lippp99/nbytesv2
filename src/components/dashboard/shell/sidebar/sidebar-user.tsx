import Link from "next/link";
import { account } from "@/components/dashboard/shared/dashboard-data";
import { appFocus, iconAction } from "@/components/app-kit/button";
import { LogoutIcon } from "@/components/icons/ui/logout";
import { shellCopy } from "../shell-copy";
import { LogoutForm } from "./logout-form";

const person =
  `min-w-0 flex-1 rounded-app-control px-3 py-2 leading-tight transition-colors hover:bg-app-hover ${appFocus}`;

/** Who is signed in (links to Account Settings) and sign-out, at the foot of the panel; the rail shows the avatar. */
export function SidebarUser() {
  return (
    <div className="flex items-center gap-1 border-t border-app-border p-3">
      <Link href="/settings" aria-label={shellCopy.account} className={person}>
        <span className="block truncate text-app-ui text-app-text">{account.userName}</span>
        <span className="block truncate text-app-small text-app-text-3">{account.email}</span>
      </Link>
      <LogoutForm className={iconAction("cursor-pointer")} title={shellCopy.signOut}>
        <LogoutIcon className="size-5!" />
      </LogoutForm>
    </div>
  );
}
