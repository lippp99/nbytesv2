import type { ReactNode, Ref } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

type StepHeadingProps = { icon: IconSvgElement; title: string; sub: ReactNode; headingRef: Ref<HTMLHeadingElement> };

/** Centred top of every login step: soft accent icon tile, the h1 (focused on step change), one line under it. */
export function StepHeading({ icon, title, sub, headingRef }: StepHeadingProps) {
  return (
    <div className="text-center">
      <span aria-hidden className="mx-auto mb-4 grid size-12 place-items-center rounded-app-control bg-app-accent-soft text-app-accent-text">
        <HugeiconsIcon icon={icon} className="size-5.5" />
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="font-heading text-app-title text-balance text-app-text outline-none">{title}</h1>
      <p className="mt-2 text-app-body text-balance text-app-text-2">{sub}</p>
    </div>
  );
}
