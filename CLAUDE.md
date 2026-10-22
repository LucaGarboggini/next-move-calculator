# CLAUDE.md — Next-Move Calculator

Goal: open-source web app (portfolio) inspired by nextchessmove.com — user sets up any chess position and gets the best move(s), evaluation and lines, computed 100% in the browser on phone, tablet and desktop. Code must stay clean and the UI must scale to future redesigns and features without rewrites.

## Environment

- Claude Code in VS Code on the user's machine, local git. Repo: github.com/LucaGarboggini/next-move-calculator (public); create with `gh` if authenticated, else ask the user for the remote URL. Never ask for or store credentials.
- One branch per deliverable, merged into main via PR only when lint, typecheck, tests and build pass. Conventional Commits.
- Hosting is out of scope until the app is finished and running locally. Keep the output a static bundle; README lists what any host must provide (COOP/COEP).

## Stack (latest stable versions)

- Vite + React + TypeScript (strict), npm, current Node LTS.
- UI: Tailwind CSS + shadcn/ui (Radix primitives, code owned in repo), Storybook for the component catalog.
- Board: chessground. Rules/FEN/PGN/SAN/setup validation: chessops. Never hand-roll move generation.
- Engine: Stockfish 19 via npm `stockfish` (nmrugg) in a Web Worker with an own typed UCI client. Engine files obtained at install/build time, never committed.
- State: Zustand. i18n: en (default) + pt-BR.
- Tests: Vitest + Testing Library; Playwright for end-to-end with the real engine across desktop Chromium/Firefox/WebKit and phone/tablet device profiles.
- ESLint (incl. layer-boundary rules) + Prettier; GitHub Actions CI (lint, typecheck, test, build); .vscode/ with recommended extensions and settings.
- Dev and preview servers send COOP/COEP so multi-threaded mode works on localhost; single-threaded fallback when not cross-origin isolated.

## Architecture

Dependency direction: `app → features → (ui, board, state) → (engine, core)`. Lower layers never import higher ones; enforced by lint.

- `core/` pure TS chess domain over chessops — no React, no DOM.
- `engine/` `Engine` interface + Stockfish worker adapter + UCI client.
- `board/` `BoardView` interface + chessground adapter + React wrapper.
- `ui/` design system: tokens, themes, primitives, layout — no chess logic.
- `state/` Zustand stores; persisted stores are versioned with migrations.
- `features/` editor, analysis, settings, saved-boards — each self-contained with a public `index.ts`; features don't import each other.
- `app/` shell, providers, composition.
- Third-party libs (chessground, chessops, stockfish) are used only inside their adapter; swapping one must not touch features.

## UI rules

- Every visual value comes from design tokens (CSS variables mapped into Tailwind): color, spacing, radius, typography, shadow, motion, z-index. No raw values in components.
- Themes are token sets: light/dark now; board and piece themes pluggable.
- Features compose ui/ primitives; no ad-hoc styling of raw HTML.
- Layout uses slots: the shell exposes a board area and a panel area; new panels are added by registration, not by editing the shell.
- Every user-facing string goes through i18n.
- Accessible by default: keyboard, focus, ARIA, WCAG AA contrast.
- Every primitive and feature component has a Storybook story.

## Product constraints

- Client-only, no backend. GPL-3.0.
- Engine size setting: Lite (default) or Full (~94 MB, strongest, cached after first download).
- Eval always from White's POV, mates as #N; side to move always obvious.

## Platforms

- Browser only — no native apps or desktop wrappers. One responsive codebase for phone, tablet and desktop, portrait and landscape.
- Supported: latest 2 versions of Chrome, Edge, Firefox and Safari, incl. iOS/iPadOS Safari and Android Chrome.
- Layouts: phone stacked (board first), tablet adapts to orientation, desktop board + side panel. The board always fits the viewport; use dynamic viewport units and safe-area insets.
- Input parity: touch, mouse, pen, keyboard. No hover- or right-click-only actions; touch targets ≥ 44 px; dragging on the board never scrolls the page.
- Device-aware engine defaults: threads from hardwareConcurrency, conservative hash, Lite on phones; Full is opt-in with a size/memory warning. Searches stop cleanly when the tab is backgrounded and can be restarted.

## Quality bar

- UI never blocks during search; stop/restart never shows a stale result.
- Significant decisions recorded as short ADRs in docs/adr/.
- Each deliverable ends with README updated and no leftover TODOs.
