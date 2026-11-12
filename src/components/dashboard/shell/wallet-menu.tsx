"use client";

import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { ArrowDown01Icon, ArrowUpRight01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { appFocus, primaryAction, secondaryAction } from "@/components/app-kit/button";
import { WalletIcon } from "@/components/dashboard/shared/icons/wallet";
import { PlusIcon } from "@/components/icons/ui/plus";
import { formatWib } from "@/lib/date-format";
import { formatIdr, formatMicros, formatSignedMicros } from "@/lib/price-format";
import { shellCopy } from "./shell-copy";

const copy = shellCopy.wallet;

const trigger =
  "group inline-flex h-9 shrink-0 items-center gap-2 rounded-app-control border border-app-border bg-app-surface pr-2 pl-2.5 " +
  "transition-colors duration-150 ease-out hover:bg-app-hover data-popup-open:bg-app-hover " + appFocus;
// Never wider than the phone screen minus the 12px collision padding on each side.
const popup =
  "w-78 max-w-[calc(100vw-24px)] origin-(--transform-origin) rounded-app-card border border-app-border bg-app-raised " +
  "shadow-app-raised outline-none transition-[opacity,scale] duration-150 ease-out data-starting-style:scale-97 " +
  "data-starting-style:opacity-0 data-ending-style:scale-97 data-ending-style:opacity-0 motion-reduce:transition-none";

type Rate = { idrPerUsd: number; setAt: string } | null;

/** Same footprint as the trigger, while the balance streams in (no layout shift in the header). */
export function WalletMenuSkeleton() {
  return <span aria-hidden className="h-9 w-28 shrink-0 animate-pulse rounded-app-control border border-app-border bg-app-surface motion-reduce:animate-none" />;
}

/** Warning dot; always next to a word or inside a labelled control, never color alone. */
const dot = <span aria-hidden className="size-2 shrink-0 rounded-full bg-app-warning" />;

/** Header wallet: the available balance at a glance; top-up and Billing one click away. */
export function WalletMenu({ availableMicros, heldMicros, rate, minIdr }: {
  availableMicros: number; heldMicros: number; rate: Rate; minIdr: number;
}) {
  const credit = formatSignedMicros(availableMicros);
  // B7: at or below zero every API request is refused until a deposit lands.
  const empty = availableMicros <= 0;
  return (
    <Popover.Root>
      <Popover.Trigger aria-label={`${copy.open}: ${credit}${empty ? `, ${copy.empty}` : ""}`} className={trigger}>
        <WalletIcon className="size-5 text-app-text-2" />
        {/* mono numbers so the bar does not jump when the balance changes */}
        <span className="font-mono text-app-code font-medium text-app-text tabular-nums">{credit}</span>
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden
          className="size-4 text-app-text-3 transition-transform duration-150 group-data-popup-open:rotate-180 motion-reduce:transition-none" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12} className="z-40">
          <Popover.Popup className={popup}>
            <WalletSummary availableMicros={availableMicros} heldMicros={heldMicros} rate={rate} empty={empty} minIdr={minIdr} />
            <div className="flex gap-2 border-t border-app-border px-4 pt-3 pb-4">
              <Popover.Close nativeButton={false} render={<Link href="/billing#deposit" className={primaryAction("flex-1")} />}>
                <PlusIcon />
                {copy.topUp}
              </Popover.Close>
              <Popover.Close nativeButton={false} render={<Link href="/billing" className={secondaryAction()} />}>
                {copy.billing}
                <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden className="text-app-text-3" />
              </Popover.Close>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function WalletSummary({ availableMicros, heldMicros, rate, empty, minIdr }: {
  availableMicros: number; heldMicros: number; rate: Rate; empty: boolean; minIdr: number;
}) {
  // shortcut: float rounding is fine for an "≈" display figure; deposits use the exact integer math in deposit-contract.
  const idr = rate && !empty ? Math.round((availableMicros * rate.idrPerUsd) / 1_000_000) : null;
  return (
    <div className="px-5 pt-5 pb-4">
      <div className="flex items-center justify-between gap-3">
        <Popover.Title className="text-app-small text-app-text-2">{copy.available}</Popover.Title>
        {empty && <span className="flex items-center gap-1.5 text-app-small font-medium text-app-warning">{dot}{copy.empty}</span>}
      </div>
      <p className={`mt-1.5 font-mono text-3xl/tight tracking-tight tabular-nums ${empty ? "text-app-text-2" : "text-app-text"}`}>
        {formatSignedMicros(availableMicros)}
      </p>
      {idr !== null && <p className="mt-1 font-mono text-app-code text-app-text-2 tabular-nums">≈ {formatIdr(idr)}</p>}
      {empty && <p className="mt-3 text-app-small text-app-text-2">{copy.emptyHint(formatIdr(minIdr))}</p>}
      {heldMicros > 0 && (
        <p className="mt-2.5 flex items-center gap-2 text-app-small text-app-text-2">
          <HugeiconsIcon icon={Clock01Icon} aria-hidden className="size-3.5 shrink-0 text-app-text-3" />
          <span><span className="font-mono text-app-text tabular-nums">{formatMicros(heldMicros)}</span> {copy.held}</span>
        </p>
      )}
      <div className="mt-4 rounded-app-code bg-app-inset px-3.5 py-3 text-app-small">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-app-text-2">{copy.rate}</span>
          <span className="font-mono text-app-text tabular-nums">{rate ? `1 USD = ${formatIdr(rate.idrPerUsd)}` : copy.rateNone}</span>
        </div>
        {rate && <p className="mt-1 text-app-text-3">{copy.updated(formatWib(rate.setAt))}</p>}
      </div>
    </div>
  );
}
