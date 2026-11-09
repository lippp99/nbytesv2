import Link from "next/link";
import { appFocus } from "@/components/app-kit/button";
import { Badge } from "@/components/app-kit/badge";
import { shellCopy } from "./shell-copy";

const inner =
  "mx-auto flex w-full max-w-app flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10";

/** Quiet footer: copyright, the demo-data notice, a few real routes and the way back to the public site. */
export function AppFooter() {
  return (
    <footer className="border-t border-app-border">
      <div className={inner}>
        <div className="flex flex-wrap items-center gap-3 text-app-small text-app-text-3">
          <span>© 2026 nbytes</span>
          <span title={shellCopy.demoTitle}>
            <Badge tone="warning">{shellCopy.demo}</Badge>
          </span>
        </div>
        <nav aria-label={shellCopy.footerNav}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-app-small">
            {shellCopy.footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={`rounded-sm text-app-text-2 transition-colors hover:text-app-text ${appFocus}`}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
