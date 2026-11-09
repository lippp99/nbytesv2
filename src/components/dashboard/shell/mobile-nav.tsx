"use client";

import { type MouseEvent, type ReactNode, useState } from "react";
import { iconAction } from "@/components/app-kit/button";
import { CloseIcon } from "@/components/icons/ui/close";
import { MenuIcon } from "@/components/icons/ui/menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { shellCopy } from "./shell-copy";

// Overrides the sheet's edge-to-edge left panel; ui/ uses the bare class merger, so custom tokens need `!`.
const drawer =
  "gap-0 overflow-hidden border border-app-border bg-app-page p-0 shadow-app-raised! rounded-app-card! " +
  "data-[side=left]:inset-y-3 data-[side=left]:left-3 data-[side=left]:h-auto data-[side=left]:w-80";

/**
 * Below lg the sidebar opens as a floating drawer (12px off the edges, card radius) over a blurred page; following any
 * link inside closes it. Menu and close use the owner's two-tone icons, not lucide. The blur lives in globals.css.
 */
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  function closeOnLink(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger aria-label={shellCopy.openMenu} className={iconAction("-ml-2 size-10 lg:hidden")}>
        <MenuIcon className="size-5!" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className={drawer}>
        <SheetTitle className="sr-only">{shellCopy.navLabel}</SheetTitle>
        <SheetClose aria-label={shellCopy.closeMenu} className={iconAction("absolute top-3.5 right-3 z-10")}>
          <CloseIcon className="size-5!" />
        </SheetClose>
        <div onClick={closeOnLink} className="h-full">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
