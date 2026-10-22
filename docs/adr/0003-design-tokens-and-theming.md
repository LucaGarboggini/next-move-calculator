# 0003 — Design tokens, themes and the shell

Status: accepted

## Context

The UI must survive redesigns without rewrites, work on touch and pointer devices, and meet WCAG AA. Component code must therefore never contain visual decisions.

## Decision

- **Tokens are CSS custom properties in `src/ui/styles/tokens/`**, one file per concern: `colors.light.css`, `colors.dark.css`, `board.css`, `typography.css`, `shape.css`, `layout.css`, `motion.css`, `z-index.css`.
- **`src/ui/styles/theme.css` maps tokens into Tailwind** (`--color-*`, radii, shadows, `h-control-*`, `w-panel`, `z-modal`, ...). Components use only those utilities, so a full re-theme edits token files only.
- **Themes are token sets.** `:root` is light, `.dark` is dark; both must define the same names. Board themes are independent token sets selectable with `[data-board-theme]`.
- **Theme choice is `system` (default) | `light` | `dark`**, stored in a versioned Zustand store (`state/theme.ts`). `app/providers/ThemeProvider` applies `.dark` to `<html>` and follows OS changes live; an inline script in `index.html` applies it before first paint to avoid a flash.
- **Touch targets come from tokens.** `--control-*` heights are compact for fine pointers and >= 44 px under `(pointer: coarse)`. Small native-looking controls (checkbox, radio, switch, slider thumb) get the `hit-area` utility, which grows the hit area to 44 px without changing their look.
- **Shell layout** (`ui/layout`): a `split` variant (>= 64rem wide, or any landscape) places the board beside the panel area; otherwise they stack with the board first. Side by side the page does not scroll and the board is the largest square fitting its container (`board-fit`, container query units). Panels are added with `registerPanel` (`app/panels/registry.ts`); the shell is never edited.
- **Shadcn primitives** are generated into `src/ui/primitives`, then owned: control sizes, z-index, shadows, radii and scrims were replaced by token utilities.

## Enforcement

`tools/tokens.test.ts` fails the build when:

- a hex/`rgb()`/`oklch()` value or an arbitrary px/rem value appears outside token files;
- light and dark define different token names, or `theme.css` maps an undefined token;
- any foreground/background token pair drops below WCAG AA (4.5:1 text, 3:1 UI), in either theme.

`src/stories.test.tsx` requires a story for every primitive and renders every story in both themes. Storybook has theme and locale toolbars; `a11y` runs in `error` mode.

## Consequences

- Adding a theme = a new token file plus its selector; no component changes.
- Renaming or adding a token touches the token file and `theme.css` only.
- Raw values are rejected by tests, so redesigns cannot silently leak into components.
