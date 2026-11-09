import Link from "next/link";
import { appFocus, iconAction } from "@/components/app-kit/button";
import { LogoutIcon } from "@/components/icons/ui/logout";
import { displayName, initialsOf } from "@/lib/display-name";
import { readSession } from "@/lib/server/auth/session";
import { cn } from "@/lib/utils";
import { shellCopy } from "../shell-copy";
import { LogoutForm } from "./logout-form";
import { tip } from "./sidebar-rail";

// Server components: they read the signed-in user (one query per request, readSession is React cache()), so the
// sidebar renders them behind <Suspense> (sidebar.tsx). The dashboard layout already sends signed-out visitors away.

const person =
  `min-w-0 flex-1 rounded-app-control px-3 py-2 leading-tight transition-colors hover:bg-app-hover ${appFocus}`;
const bar = "block animate-pulse rounded-full bg-app-hover motion-reduce:animate-none";
const avatar =
  "grid size-8 place-items-center rounded-full border border-app-border bg-app-surface text-app-small font-medium text-app-text-2";

/** Who is signed in (links to Account Settings) and sign-out, at the foot of the panel. */
export async function SidebarUser() {
  const session = await readSession();
  if (!session) return null;
  const { user } = session;
  return (
    <div className="flex items-center gap-1 border-t border-app-border p-3">
      <Link href="/settings" aria-label={shellCopy.account} className={person}>
        <span className="block truncate text-app-ui text-app-text">{displayName(user)}</span>
        <span className="block truncate text-app-small text-app-text-3">{user.email}</span>
      </Link>
      <LogoutForm className={iconAction("cursor-pointer")} title={shellCopy.signOut}>
        <LogoutIcon className="size-5!" />
      </LogoutForm>
    </div>
  );
}

export function SidebarUserSkeleton() {
  return (
    <div aria-hidden className="space-y-2 border-t border-app-border px-6 py-5">
      <span className={`${bar} h-3 w-28`} />
      <span className={`${bar} h-3 w-36`} />
    </div>
  );
}

/** The account avatar at the foot of the rail (initials, full name on hover and focus). */
export async function RailAvatar() {
  const session = await readSession();
  if (!session) return null;
  return (
    <Link href="/settings" aria-label={shellCopy.account} className={cn("group relative rounded-full", appFocus)}>
      <span aria-hidden className={avatar}>{initialsOf(session.user)}</span>
      <span aria-hidden className={tip}>{displayName(session.user)}</span>
    </Link>
  );
}

export function RailAvatarSkeleton() {
  return <span aria-hidden className={`${bar} size-8`} />;
}
