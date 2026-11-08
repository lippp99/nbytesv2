import Link from "next/link";
import { BookOpen01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderBreadcrumb } from "./header-breadcrumb";
import { MobileNav } from "./mobile-nav";
import { shellCopy } from "./shell-copy";
import { SidebarContent } from "./sidebar-content";
import { primaryAction } from "@/components/dashboard/shared/dashboard-buttons";

const ghostLink =
  `hidden h-9 items-center gap-2 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-muted ` +
  `hover:text-foreground sm:inline-flex ${focusRing}`;

/** Sticky bar over the page: menu (small screens), where you are, and the two things people reach for most. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-10">
        <MobileNav>
          <SidebarContent />
        </MobileNav>
        <HeaderBreadcrumb />
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link href="/docs" className={ghostLink}>
            <HugeiconsIcon icon={BookOpen01Icon} aria-hidden className="size-4" />
            {shellCopy.docs}
          </Link>
          <ThemeToggle className="rounded-full" />
          <Link href="/api-keys" aria-label={shellCopy.createKey} className={primaryAction("h-9 rounded-full px-3 sm:px-4")}>
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden />
            <span className="hidden sm:inline">{shellCopy.createKey}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
