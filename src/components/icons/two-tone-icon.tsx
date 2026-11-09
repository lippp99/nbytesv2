export type IconProps = { className?: string };

type TwoToneIconProps = IconProps & { tone: string; line: string };

/**
 * Draws one icon of the owner's two-tone set (24x24): `tone` in currentColor at 40% opacity, `line` in full
 * currentColor, so the icon takes the text color of whatever holds it. Decorative: the control carries the label.
 */
export function TwoToneIcon({ tone, line, className }: TwoToneIconProps) {
  return (
    // width/height are only a 24px fallback (like lucide); any size class on it or its parent wins.
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" className={className}>
      <path fill="currentColor" fillOpacity={0.4} fillRule="evenodd" d={tone} />
      <path fill="currentColor" fillRule="evenodd" d={line} />
    </svg>
  );
}
