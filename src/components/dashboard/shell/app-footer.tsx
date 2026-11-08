import Link from "next/link";
import { focusRing } from "@/components/button-styles";
import { shellCopy } from "./shell-copy";

const inner =
  "mx-auto flex max-w-content flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6 " +
  "md:flex-row md:items-center md:justify-between lg:px-10";

/** Quiet footer: the demo notice, a few real routes, and the way back to the public site. */
export function AppFooter() {
  return (
    <footer className="border-t border-border">
      <div className={inner}>
        <p className="flex items-center gap-2">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-warn" />
          <span>© 2026 nbytes · {shellCopy.footerNote}</span>
        </p>
        <nav aria-label={shellCopy.footerNav}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {shellCopy.footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`rounded-sm transition-colors hover:text-foreground ${focusRing}`}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
