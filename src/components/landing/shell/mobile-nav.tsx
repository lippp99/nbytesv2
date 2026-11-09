"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { CloseIcon } from "@/components/icons/ui/close";
import { MenuIcon } from "@/components/icons/ui/menu";
import { focusRing, outlineButton, primaryButton, secondaryButton } from "@/components/button-styles";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { mockModels } from "@/lib/model-catalog";
import { actions, nav } from "../shared/landing-copy";

// Design A (owner pick, 2026-11-08): a rounded card floating 12px under the top edge over a dimmed, blurred page.
// Built on the Base UI dialog directly so the backdrop blur and card shape need no edit to ui/sheet or globals.css.
const backdrop =
  "fixed inset-0 z-50 bg-foreground/20 backdrop-blur-md transition-opacity duration-200 ease-out " +
  "data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none";
const card =
  "fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 rounded-card border border-foreground/8 " +
  "bg-background/95 p-2 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_24px_48px_-12px_rgb(0_0_0/0.28)] outline-none " +
  "transition-[opacity,translate] duration-200 ease-out data-starting-style:-translate-y-2 data-starting-style:opacity-0 " +
  "data-ending-style:-translate-y-2 data-ending-style:opacity-0 motion-reduce:transition-none";
const navLink =
  "flex h-14 items-center rounded-panel px-3.5 font-heading text-2xl font-medium tracking-tight text-foreground " +
  `transition-colors duration-150 hover:bg-muted active:bg-muted ${focusRing}`;
const closeButton =
  `grid size-11 place-items-center rounded-full bg-muted text-foreground transition-colors duration-150 hover:bg-guide ${focusRing}`;

// Real count beside the item it describes, like the dashboard sidebar.
const counts: Record<string, number> = { "#model": mockModels.length };

export function MobileNav() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className={secondaryButton("size-11 px-0 md:hidden")} aria-label={actions.menu}>
        <MenuIcon className="size-4" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={backdrop} />
        <Dialog.Popup className={card}>
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className="flex h-13 items-center gap-1 pr-1 pl-2.5">
            <Wordmark />
            <ThemeToggle className="ml-auto size-11 rounded-full" />
            <Dialog.Close className={closeButton} aria-label={actions.closeMenu}>
              <CloseIcon className="size-4" />
            </Dialog.Close>
          </div>
          <nav aria-label="Utama" className="py-2">
            <ul className="space-y-0.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Dialog.Close nativeButton={false} render={<a href={item.href} className={navLink} />}>
                    {item.label}
                    {counts[item.href] !== undefined && (
                      <span className="ml-auto font-mono text-xs font-normal tracking-normal text-muted-foreground">
                        {counts[item.href]}
                      </span>
                    )}
                  </Dialog.Close>
                </li>
              ))}
            </ul>
          </nav>
          {/* pr-1.5/pb-1.5 leave room for the primary button's orange offset shadow inside the card */}
          <div className="grid grid-cols-2 gap-2 pt-2 pr-1.5 pb-1.5">
            <Link href="/login" className={outlineButton("h-12 w-full bg-background")}>{actions.signIn}</Link>
            <Link href="/login?mode=register" className={primaryButton("h-12 w-full px-3")}>{actions.register}</Link>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
