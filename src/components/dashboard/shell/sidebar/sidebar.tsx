import { Suspense } from "react";
import { SidebarContent } from "./sidebar-content";
import { RailAvatar, RailAvatarSkeleton, SidebarUser, SidebarUserSkeleton } from "./sidebar-user";

/**
 * The sidebar with the signed-in user filled in. SidebarContent is a client component, so the user parts are server
 * components passed in as slots, each behind its own <Suspense> (docs: a session read cannot be in the static shell).
 */
export function Sidebar() {
  return (
    <SidebarContent
      user={<Suspense fallback={<SidebarUserSkeleton />}><SidebarUser /></Suspense>}
      avatar={<Suspense fallback={<RailAvatarSkeleton />}><RailAvatar /></Suspense>}
    />
  );
}
