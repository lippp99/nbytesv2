"use client";

import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { appFocus, ghostAction, primaryAction } from "@/components/app-kit/button";
import { WalletIcon } from "@/components/dashboard/shared/icons/wallet";
import { formatSignedMicros } from "@/lib/price-format";
import { shellCopy } from "./shell-copy";

const copy = shellCopy.wallet;

const trigger =
  "group inline-flex h-9 shrink-0 items-center gap-2.5 rounded-app-control border border-app-border bg-app-surface pr-2 pl-1 " +
  "transition-colors duration-150 ease-out hover:bg-app-hover data-popup-open:bg-app-hover " + appFocus;
const popup =
  "w-80 origin-(--transform-origin) rounded-app-card border border-app-border bg-app-raised shadow-app-raised outline-none " +
  "transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-97 data-starting-style:opacity-0 " +
  "data-ending-style:scale-97 data-ending-style:opacity-0 motion-reduce:transition-none";

/** Same footprint as the trigger, while the balance streams in (no layout shift in the header). */
export function WalletMenuSkeleton() {
  return <span aria-hidden className="h-9 w-28 shrink-0 animate-pulse rounded-app-control border border-app-border bg-app-surface motion-reduce:animate-none" />;
}

/** Header wallet: the available balance (from the server) at a glance; top-up and Billing one click away. */
export function WalletMenu({ availableMicros }: { availableMicros: number }) {
  const credit = formatSignedMicros(availableMicros);
  return (
    <Popover.Root>
      <Popover.Trigger aria-label={`${copy.open}: ${credit}`} className={trigger}>
        <span className="grid size-7 place-items-center rounded-app-inner bg-app-inset text-app-text-2">
          <WalletIcon className="size-4.5" />
        </span>
        {/* mono numbers so the bar does not jump when the balance changes; the label returns from md */}
        <span className="flex items-baseline gap-1.5">
          <span className="hidden text-app-small text-app-text-3 md:inline">{copy.credit}</span>
          <span className="font-mono text-app-code font-medium text-app-text tabular-nums">{credit}</span>
        </span>
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden
          className="size-4 text-app-text-3 transition-transform duration-150 group-data-popup-open:rotate-180 motion-reduce:transition-none" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="z-40">
          <Popover.Popup className={popup}>
            <div className="flex items-center gap-3 border-b border-app-border px-5 pt-5 pb-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-app-control bg-app-inset text-app-text-2">
                <WalletIcon className="size-5" />
              </span>
              <div className="min-w-0 leading-tight">
                <Popover.Title className="text-app-small text-app-text-3">{copy.credit}</Popover.Title>
                <p className="mt-1 font-mono text-app-section text-app-text tabular-nums">{credit}</p>
              </div>
            </div>
            <div className="space-y-2 p-4">
              <Popover.Close nativeButton={false} render={<Link href="/billing#deposit" className={primaryAction("w-full")} />}>
                {copy.topUp}
              </Popover.Close>
              <Popover.Close nativeButton={false} render={<Link href="/billing" className={ghostAction("w-full")} />}>
                {copy.billing}
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
