# 0011 — Loading performance and the bundle budget

Status: accepted

## Context

The app has to open quickly on a phone. The heavy part, Stockfish, is a WebAssembly file (1.7 MB Lite, ~99 MB Full) that is already fetched by a worker, so the question left for the JavaScript bundle is how much a first paint must carry, and how to keep it from growing unnoticed. The first production build was a single 627 kB (200 kB gzip) chunk.

## Decision

- **The engine is never part of the page load.** The worker and the wasm files are fetched on the first Calculate. `e2e/flows.spec.ts` asserts that no request to `/engine/` is made before then.
- **Code that is not needed to calculate loads on demand**, with `React.lazy` at composition points:
  - the settings and shortcut dialogs (`SettingsControls`; also preloaded when their button is hovered or focused, so opening feels instant),
  - the saved-boards panel (`app/panels/defaults.ts`).

  The shell wraps every panel in `Suspense` with `PanelFallback`, so a panel that loads late reserves its space and the page does not jump. To make these splits real, the settings feature stopped exporting the dialogs and the form from its `index.ts` (a static re-export would pull them back into the entry chunk).

- **The panels that make up the first screen stay eager** (analysis, position, FEN, moves, search settings). Splitting them would delay the first useful paint to save a few kB, and the Calculate button is the point of the app.
- **Vendor chunks** (`vite.config.ts`): React, chessground + chessops, the UI libraries (Radix, Lucide) and i18next each get a stable chunk, so a release that changes only app code leaves the cached libraries valid. This also removes the "chunk larger than 500 kB" warning honestly rather than by raising the limit.
- **A budget is enforced.** `npm run check:bundle` (after `npm run build`, and in CI) adds up the gzip size of everything `index.html` loads eagerly (scripts, modulepreloads, stylesheets) and fails above **250 kB**; it also fails if an engine file is referenced by the page. The first measurement was 212 kB, so the budget leaves about 15% headroom: a new dependency has to be a conscious decision (raise the number in `tools/bundle-budget.ts` in the same PR and say why).

## Consequences

- Most of the initial weight is React (66 kB gzip), the UI libraries (44 kB), chess libraries (20 kB) and i18n (16 kB). Only a smaller UI toolkit or a lighter i18n would shrink it much further; neither is worth the churn now.
- Locale files are bundled (en and pt-BR together are a few kB). If many languages are added, load the active one on demand.
- Tests that open a lazily loaded dialog must wait for it (`findByRole`).
