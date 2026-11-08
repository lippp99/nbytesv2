"use client";

import { type MouseEvent, type ReactNode, useState } from "react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { focusRing } from "@/components/button-styles";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { shellCopy } from "./shell-copy";

const iconButton = `grid size-10 place-items-center rounded-chip text-muted-foreground hover:bg-muted hover:text-foreground ${focusRing}`;

/** Below lg the sidebar opens in a sheet; following any link inside closes it. Close button is Hugeicons, not lucide. */
export function MobileNav({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  function closeOnLink(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger aria-label={shellCopy.openMenu} className={`${iconButton} -ml-2 lg:hidden`}>
        <HugeiconsIcon icon={Menu01Icon} aria-hidden className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="gap-0 bg-background p-0">
        <SheetTitle className="sr-only">{shellCopy.navLabel}</SheetTitle>
        <SheetClose aria-label={shellCopy.closeMenu} className={`${iconButton} absolute top-3 right-3 z-10`}>
          <HugeiconsIcon icon={Cancel01Icon} aria-hidden className="size-5" />
        </SheetClose>
        <div onClick={closeOnLink} className="h-full">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
