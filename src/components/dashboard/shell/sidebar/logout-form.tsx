import type { ReactNode } from "react";
import { shellCopy } from "../shell-copy";

/**
 * The one sign-out control (panel and folded rail). A POST form, not a link: a GET logout could fire from a prefetch
 * or another site's <img>. It is a plain form, so it also works without JavaScript.
 */
export function LogoutForm({ className, title, children }: { className: string; title?: string; children: ReactNode }) {
  return (
    <form action="/api/auth/logout" method="post" className="contents">
      <button type="submit" aria-label={shellCopy.signOut} title={title} className={className}>
        {children}
      </button>
    </form>
  );
}
