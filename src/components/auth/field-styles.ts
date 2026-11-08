// Input look after jatevo.ai login: 48px, 12px radius, 1px border, ink border + orange ring on focus, destructive
// border on error. `!` because ui/input merges with the bare `cn` package (see email-step).
export const fieldFocus =
  "rounded-panel! border-input focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-accent-mark " +
  "aria-invalid:border-destructive aria-invalid:ring-0 dark:bg-transparent";

export const errorText = "mt-2 text-sm text-destructive";
