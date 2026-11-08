import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { focusRing, outlineButton, primaryButton } from "@/components/button-styles";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { actions, nav } from "./landing-copy";
import { MobileNav } from "./mobile-nav";
import { frame } from "./section";

const navLink =
  "relative inline-flex h-10 items-center px-1.5 text-ui font-medium md:text-nav text-foreground/80 transition-colors duration-150 " +
  "after:absolute after:inset-x-1.5 after:bottom-1.5 after:h-px after:origin-left after:scale-x-0 after:bg-foreground " +
  `after:transition-transform after:duration-300 after:ease-out-expo hover:text-foreground hover:after:scale-x-100 ${focusRing}`;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-dashed border-guide bg-background pt-safe">
      <div className={`${frame} flex h-15 items-center gap-4 md:h-17`}>
        <Wordmark />
        <nav aria-label="Utama" className="hidden flex-1 justify-center md:flex">
          <ul className="flex gap-4">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className={navLink}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0 md:gap-3">
          <ThemeToggle />
          <Link href="/login" className={outlineButton("hidden h-9 px-3 text-ui md:inline-flex md:h-9.5 md:px-3.5 md:text-nav")}>
            {actions.signIn}
          </Link>
          <Link href="/login" className={primaryButton("h-9 px-3 text-ui md:h-9.5 md:px-3.5 md:text-nav")}>
            {actions.getKey}
            <ChevronRightIcon aria-hidden className="hidden sm:block" />
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
