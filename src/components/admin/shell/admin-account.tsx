import { iconAction } from "@/components/app-kit/button";
import { LogoutIcon } from "@/components/icons/ui/logout";
import type { AdminMe } from "@/lib/admin-auth/admin-auth-contract";
import { shellCopy } from "./shell-copy";

/**
 * The signed-in admin and sign-out, at the foot of the sidebar. Sign-out is a POST form, not a link: a GET logout
 * could fire from a prefetch or another site's <img>; a plain form also works without JavaScript.
 */
export function AdminAccount({ me }: { me: AdminMe }) {
  return (
    <>
      <div className="min-w-0 flex-1 px-3 py-1 leading-tight rail:hidden">
        <span className="block truncate text-app-ui text-app-text">{me.name ?? me.email}</span>
        <span className="block truncate text-app-small text-app-text-3">{me.name ? `${shellCopy.owner} · ${me.email}` : shellCopy.owner}</span>
      </div>
      <form action="/api/admin/auth/logout" method="post" className="contents">
        <button type="submit" aria-label={shellCopy.signOut} title={shellCopy.signOut} className={iconAction()}>
          <LogoutIcon className="size-5!" />
        </button>
      </form>
    </>
  );
}
