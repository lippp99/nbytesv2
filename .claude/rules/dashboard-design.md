# Dashboard design foundation

Visual contract for everything under `src/app/(dashboard)/` and `src/components/dashboard/`. The landing page and
login keep their own look; nothing here may change them. Decided with the owner on 2026-11-08.

## 1. Fixed decisions

- Accent: nb-orange `#c2410c` (logo color). Fonts: Funnel Sans (UI), Funnel Display (page titles only), Fragment Mono
  (code, ids, numbers). Density: spacious, as today.
- Mode: Operate (a tool people work in). Familiar patterns, precise details, restraint. Brand lives in the accent,
  the fonts and the care in details, not in decoration.
- The dashboard never borrows the landing page's look: no offset-shadow buttons (`primaryButton`, `outlineButton`),
  no `.hl` highlight, no dashed guide lines, no bento cards, no `ink-panel` dark islands, no landing mock styling.

## 2. Scope: how the dashboard gets its own tokens without touching the landing

- Global tokens in `globals.css` (`:root`, `.dark`) belong to the landing page. Never edit them for the dashboard.
- The dashboard layout root carries `data-app`. All dashboard tokens live in one block keyed on
  `html:has([data-app])` (and `.dark` variant), so portals (sheet, popover) rendered into `body` follow them too.
- That block overrides the shadcn tokens (`--background`, `--card`, `--popover`, `--muted`, `--border`, `--input`,
  `--ring`, `--foreground`, `--muted-foreground`, ...) so `ui/` primitives match without hand edits, and adds the
  `--app-*` tokens below as Tailwind colors.
- Guard: every dashboard change ends with `git diff --stat` showing no change in `src/components/landing/`,
  `src/app/page.tsx`, `src/app/(auth)/`, or the `:root` / `.dark` blocks.

## 3. Color tokens (OKLCH, hue 100 warm neutral)

| Token | Use | Light | Dark |
|---|---|---|---|
| `app-page` | page background, sidebar | `0.985 0.002 100` | `0.16 0.004 100` |
| `app-surface` | cards, panels, header | `1 0 0` | `0.2 0.004 100` |
| `app-inset` | code, inputs, wells inside a card | `0.97 0.003 100` | `0.18 0.004 100` |
| `app-raised` | menus, popovers, sheet (with shadow) | `1 0 0` | `0.24 0.004 100` |
| `app-border` | dividers, card edges | `0.92 0.004 100` | `0.28 0.004 100` |
| `app-border-strong` | input and control outlines | `0.66 0.006 100` | `0.5 0.006 100` |
| `app-text` | primary text | `0.2 0.005 100` | `0.95 0.003 100` |
| `app-text-2` | secondary text, labels | `0.45 0.01 100` | `0.76 0.008 100` |
| `app-text-3` | hints, placeholders, axis | `0.53 0.012 100` | `0.66 0.01 100` |
| `app-accent` | primary button fill, selection | `#c2410c` | `#c2410c` |
| `app-accent-text` | accent links and icons on surfaces | `#c2410c` | `#ff8a4c` |
| `app-accent-soft` | selected row, active nav plate | `0.96 0.03 45` | `0.27 0.06 40` |
| `app-success` / `app-warning` / `app-danger` | status text and dots | `0.52 0.12 150` / `0.55 0.12 70` / `0.55 0.2 27` | `0.72 0.13 150` / `0.8 0.13 80` / `0.68 0.18 27` |

Measured contrast (script, 2026-11-08): every text token >= 4.5:1 on page, surface and inset in both themes
(lowest: `app-text-3` on inset, light, 4.83; `app-accent-text` on inset, light, 4.75). White on `app-accent` 5.18.
Input outlines `app-border-strong` vs surface 3.11 light, 3.02 dark. Status colors >= 4.98. Re-measure after any change.

Rules:
- Depth in dark mode goes lighter: page < inset < surface < raised. Never a surface darker than the page.
- Code blocks follow the theme (`app-inset` + `app-border`), never a dark island in light mode.
- Accent only for the primary action, the current selection and links. Never for decoration or large fills.
- Status colors always come with a word or icon, never color alone.

## 4. Type (fixed rem, ratio ~1.2)

| Role | Size / line | Face |
|---|---|---|
| Page title (h1) | 1.75rem / 1.2, weight 600 | Funnel Display |
| Section title (h2) | 1.25rem / 1.3, weight 600 | Funnel Sans |
| Card title (h3) | 1rem / 1.4, weight 600 | Funnel Sans |
| Body | 0.9375rem / 1.6 | Funnel Sans |
| UI, labels, table | 0.875rem / 1.45 | Funnel Sans |
| Small, hints | 0.8125rem / 1.4 | Funnel Sans |
| Code, ids, numbers | 0.8125rem / 1.65, tabular | Fragment Mono |

No eyebrow or kicker labels above headings. No monospace for anything that is not code, an id or a number.
Prose measure 65-75ch.

## 5. Space, layout, radius, elevation

- Spacing on a 4px grid. Spacious defaults: page padding 40px desktop / 20px mobile, 40px between sections,
  24px card padding, 16px between related controls, 48px table rows, 40px control height.
- Shell: sidebar 256px on `app-page`, header 64px, content max width 1200px. Pages scroll in the window, not in a box,
  except a work area that must stay in view (the playground transcript).
- Radius: cards 16px, controls and inputs 10px, chips and badges full, code 12px. One scale, no mixing.
- Elevation: cards are flat with a 1px `app-border`. Shadow only on `app-raised` things that float (menus, popovers,
  sheet) and on the sticky header once the page scrolls.

## 6. Page patterns

- Page header: h1, one-line description, actions on the right. Nothing above the h1.
- Work area (Playground): the main work gets the widest column. Wide content (code, tables) never sits in a side
  column under ~480px; it opens in the wide area instead (tab or view switch), never with sideways scrolling.
- Reference (API Docs): explanation left, examples right, examples follow the theme.
- Lists and data (Usage, Keys, Models, Billing): tables over card grids. Empty states teach the next step.
- Forms (Settings, create key): labels above fields, errors under the field that caused them.

## 7. Components (built once in `components/dashboard/shared/`, one style each)

Button (primary, secondary, ghost), Card, Field (input, select, textarea), Segmented control, Tabs, Table, Badge,
CodeBlock (theme-following, wraps or uses the wide area), EmptyState, PageHeader. Every interactive one has
default, hover, focus, active, disabled and, where it applies, loading and error states.

## 8. Motion

150-200ms ease-out on state changes only (hover, open, select). No entrance animations on dashboard pages, no
decorative loops. Loading uses skeletons, not spinners. `prefers-reduced-motion` removes movement.

## 9. Done means

`npx tsc --noEmit`, `npm run lint`, tests pass; contrast re-measured if a token changed; the landing guard in
section 2 is clean; the impeccable detector reports nothing on the changed files.
