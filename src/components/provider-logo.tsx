import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type ProviderLogoProps = {
  icon: string;
  /** Accessible name. Omit when the name is already written next to the logo. */
  label?: string;
  className?: string;
};

// Mono SVG from public/models/ painted with currentColor through a CSS mask, so it follows light/dark (PRD §7.3).
export function ProviderLogo({ icon, label, className }: ProviderLogoProps) {
  const url = `url(/models/${icon}.svg)`;
  const style: CSSProperties = { maskImage: url, WebkitMaskImage: url };
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={style}
      className={cn(
        "inline-block size-5 shrink-0 bg-current mask-contain mask-center mask-no-repeat forced-color-adjust-none",
        className,
      )}
    />
  );
}
