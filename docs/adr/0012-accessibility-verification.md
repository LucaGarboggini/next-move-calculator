# 0012 — How accessibility is verified

Status: accepted

## Context

The project promises keyboard, focus, ARIA and WCAG AA by default. Promises in a README rot; the pass for the first release needed checks that keep failing loudly when a later change breaks them.

## Decision

- **axe on the real build** (`e2e/accessibility.spec.ts`, `@axe-core/playwright`): the main screen in light and dark, the settings and shortcut dialogs in both themes, and an invalid position in pt-BR, against WCAG 2.0/2.1/2.2 A and AA rules, in every browser and device profile. The helper (`e2e/axe.ts`) waits for running transitions first; axe otherwise reads colours half-way through a hover fade and reports contrast that nobody sees. The full flow also runs axe once an analysis is on screen.
- **A keyboard-only flow** (`e2e/flows.spec.ts`): Tab visits every control, none without a visible focus indicator (the board shows its own cursor instead of an outline) and without a trap; a position is loaded, calculated and played with the keyboard; a dialog keeps Tab inside it and hands the focus back on Escape. Safari does not Tab to buttons unless a system setting is on, so that one traversal test skips WebKit; the flow test still runs there.
- **Contrast of tokens is unit-tested** (`tools/tokens.test.ts`), now including hover states.

## Findings fixed by the pass

- **Hover contrast.** Buttons and badges lightened or darkened their background with an opacity (`bg-primary/80`), which dropped white-on-green to 4.13:1 on hover. Hover colours are now tokens (`--primary-hover`, `--secondary-hover`, `--destructive-hover`) in both themes, with their foreground pairs in the contrast test.
- **Lost focus after closing a dialog.** The dialogs are opened from state and shortcuts, so Radix had no trigger to return the focus to and it fell to `<body>`: a keyboard user started again from the top of the page. `DialogContent` now remembers the element that had the focus and restores it on close (`ui/primitives/dialog.test.tsx`).

## Consequences

- Automated checks find roughly a third of accessibility problems. Screen-reader announcements (move cursor, search status) and touch targets are covered by their own tests; a manual pass with VoiceOver or TalkBack before a public launch is still worth doing and is not replaced by this.
