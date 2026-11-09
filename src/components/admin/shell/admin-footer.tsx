import Link from "next/link";
import { appFocus } from "@/components/app-kit/button";
import { shellCopy } from "./shell-copy";

const inner =
  "mx-auto flex w-full max-w-app flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10";

/** Quiet footer like the dashboard's: copyright and console name, then a few routes admins jump between. */
export function AdminFooter() {
  return (
    <footer className="border-t border-app-border">
      <div className={inner}>
        <p className="text-app-small text-app-text-3">{shellCopy.footer.note}</p>
        <nav aria-label={shellCopy.footer.label}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-app-small">
            {shellCopy.footer.links.map((link) => (
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
