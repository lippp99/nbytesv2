import Link from "next/link";
import { ghostAction, primaryAction } from "@/components/app-kit/button";
import { BookIcon } from "@/components/icons/content/book";
import { PlusIcon } from "@/components/icons/ui/plus";
import { HeaderBreadcrumb } from "./header-breadcrumb";
import { MobileNav } from "./mobile-nav";
import { shellCopy } from "./shell-copy";
import { Sidebar } from "./sidebar/sidebar";
import { SidebarToggle } from "./sidebar/sidebar-toggle";
import { WalletMenu } from "./wallet-menu";

/** Sticky bar on the surface tone: where you are on the left, the two things people reach for most on the right. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-app-border bg-app-surface">
      <div className="flex h-16 items-center gap-3 px-5 lg:px-10">
        <SidebarToggle />
        <MobileNav>
          <Sidebar />
        </MobileNav>
        <span aria-hidden className="h-5 w-px bg-app-border" />
        <HeaderBreadcrumb />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link href="/docs" className={ghostAction("hidden sm:inline-flex", "sm")}>
            <BookIcon />
            {shellCopy.docs}
          </Link>
          <WalletMenu />
          <Link href="/api-keys" aria-label={shellCopy.createKey} className={primaryAction("ml-1 size-9 px-0 sm:w-auto sm:px-3", "sm")}>
            <PlusIcon />
            <span className="hidden sm:inline">{shellCopy.createKey}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
