"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { focusRing, outlineButton, secondaryButton } from "@/components/button-styles";
import { actions, nav } from "./landing-copy";

const linkClass = `flex h-14 items-center border-b border-dashed border-guide font-heading text-h3 ${focusRing}`;

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger className={secondaryButton("size-11 px-0 md:hidden")} aria-label={actions.menu}>
        <MenuIcon className="size-4" aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 rounded-none p-4 pt-16 sm:max-w-sm">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <nav aria-label="Utama">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <SheetClose render={<a href={item.href} className={linkClass} />}>{item.label}</SheetClose>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/login" className={outlineButton("mt-6 w-full")}>
          {actions.signIn}
        </Link>
      </SheetContent>
    </Sheet>
  );
}
