# Next-Move Calculator

Open-source web app, inspired by nextchessmove.com: set up any chess position and get the best move(s), evaluation and lines, computed 100% in your browser on phone, tablet and desktop. No backend.

> Status: design system, app shell, chess core, board, position editor, engine layer and analysis done. The saved-boards feature is not implemented yet.

## Requirements

- Node.js 24 (LTS), see `.nvmrc`
- npm

## Getting started

```sh
npm install
npm run dev        # http://localhost:5173
```

`npm install` also copies the Stockfish builds into `public/engine/` (git-ignored). Set `ENGINE_SIZES=lite` to skip the ~190 MB of Full builds.

## Scripts

| Script                                  | What it does                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `preview`               | Dev / production-preview server (both send COOP/COEP)                                                       |
| `npm run engine:fetch`                  | Copy the Stockfish builds into `public/engine/` (runs on install, dev and build)                            |
| `npm run build`                         | Typecheck and build the static bundle into `dist/`                                                          |
| `npm run lint`                          | ESLint, including layer-boundary rules                                                                      |
| `npm run typecheck`                     | `tsc -b` (strict)                                                                                           |
| `npm run format` / `format:check`       | Prettier                                                                                                    |
| `npm test` / `test:watch`               | Vitest unit and component tests                                                                             |
| `npm run test:e2e`                      | Playwright on desktop Chromium/Firefox/WebKit and phone/tablet profiles (run `npx playwright install` once) |
| `npm run storybook` / `build-storybook` | Component catalog                                                                                           |
| `npm run check`                         | lint + typecheck + test + build                                                                             |

## Architecture

```
app → features → (ui, board, state, i18n) → (engine, core)
```

Lower layers never import higher ones; this is enforced by ESLint (`eslint.config.js`) and covered by `tools/layer-rules.test.ts`. Each module exposes a public `index.ts`; other modules import only that. Third-party libraries (chessground, chessops, stockfish) are used only inside their adapter. See [`docs/adr/`](docs/adr/) for decisions.

```
src/
  core/      pure chess domain over chessops
  engine/    Engine interface, Stockfish worker adapter, UCI client
  board/     BoardView interface, chessground adapter
  ui/        design system: tokens, primitives, layout (shadcn/ui)
  i18n/      translations (en, pt-BR) and locale detection
  state/     Zustand stores (theme, locale, settings, analysis settings, saved boards: persisted, versioned, migrated; editor document; analysis session)
  features/  editor, analysis, settings, saved-boards
  app/       shell, providers, panel registry
```

## Chess core

`src/core/` is the pure TypeScript chess domain over chessops (no React, no DOM; other layers never see chessops types). It provides:

- `Setup` (editable, not-necessarily-legal position) with FEN parse/make and editing helpers; `validateSetup` lists every problem with a code and severity.
- `Position` (legal, immutable): legal moves/destinations, `play`, SAN and UCI conversion, status (check, mate, stalemate, insufficient material).
- `MoveHistory` with undo/redo, and PGN import/export.
- `toWhiteScore` / `formatEval`: engine scores from White's point of view, mates as `#N`.

See [ADR 0005](docs/adr/0005-chess-core-domain.md). Standard chess only.

## Engine

`src/engine/` exports the `Engine` interface and `createStockfishEngine({ size: 'lite' | 'full' })`; features never see Stockfish, UCI or workers.

```ts
const engine = createStockfishEngine() // Lite; threads when cross-origin isolated
const search = engine.analyze(position, { limits: { depth: 20 }, multiPv: 3 })
for await (const event of search.events) {
  if (event.type === 'info')
    show(event.searchId, event.info) // score is from the side to move
  else done(event.reason, event.move) // 'completed' | 'stopped' | 'superseded' | 'disposed' | 'failed'
}
```

- Every search has an id that is on all its events; a new `analyze` stops the old search and waits for it, so a stale result can never appear. `superseded` results must be ignored.
- `engine.subscribe` reports status and download progress (`LoadProgress`); Full (~94 MB) is downloaded once and cached in Cache Storage.
- `detectCapabilities`, `recommendedSettings` and `fullEngineWarnings` give device-aware defaults; `engine.configure({ threads, hashMb })` applies at the next search.
- To add an engine, implement `Engine`, or for any UCI engine give `UciEngine` a `connect()` that returns a `UciTransport`.

See [ADR 0008](docs/adr/0008-engine-layer.md).

## Board

`src/board/` exports `Board` (React), `PieceIcon`, `PromotionPicker` and the `BoardView` interface; chessground is used only in `chessground-adapter.ts`. The board is controlled and has three modes: `view`, `play` (legal moves from core's `Position.destinations()`, promotion picker included) and `edit` (free moves, drag off to delete, tap-to-place `EditTool`, palette drag via the `ref`). Arrows and highlights are props. It works with touch, mouse, pen and keyboard (arrows, Enter/Space, Escape, Delete) and announces moves to screen readers. Board themes (`green`, `brown`, `blue`) are token sets; piece themes (`classic`, `glyph`) are CSS. See [ADR 0006](docs/adr/0006-board-layer.md). Every mode has a Storybook story (`board/Board`).

## Position editor

`src/features/editor/` fills the board slot (`EditorBoard`) and registers three panels (position, FEN/PGN, moves). Two modes: **Edit position** (spare-piece palette, tap-to-place and eraser tools, drag pieces around, drop them off the board to delete, Delete key; side to move, castling rights, en passant square; start, clear, flip, undo, redo) and **Play moves** (legal moves only, building a move list you can step through). Paste a FEN or PGN into the FEN box to load it, copy the FEN or PGN back out. An invalid position is still shown, with every reason listed (and translated), and cannot be analyzed or played from: `useEditorSnapshot().position` is defined exactly when a position is legal, which is what the analysis feature will consume. See [ADR 0007](docs/adr/0007-position-editor.md).

## Analysis

`src/features/analysis/` registers two panels: **Analysis** (Calculate/Stop, evaluation from White's point of view as `+0.35` or `#3`, an eval bar, the best move, depth, speed, nodes and time, and the engine's lines in SAN) and **Search settings**. The best move is drawn on the board as an arrow, with fainter thin arrows for the other lines. Pick any move in a line, or the best move, to play it on the board (as one undo step).

- Limits: time 1–60 s or until stopped, optional depth (whichever is reached first ends the search), 1–5 lines. Threads and hash memory are offered within what the browser and device allow (no threads control without cross-origin isolation). Settings are remembered and apply to the next calculation.
- Recalculating is manual: changing the position (or playing a move) clears the analysis and stops any search; press Calculate again. A search is stopped when the tab goes to the background and can be restarted.
- Output is throttled to 10 updates a second so a phone stays smooth; the engine runs in a worker.
- The board and the analysis meet only in `app/AnalysisBoard.tsx` (`EditorBoard` takes an `arrows` prop), because features do not import each other. See [ADR 0009](docs/adr/0009-analysis-feature.md).

## Settings, shortcuts and saved boards

- **Settings** (gear button in the header) hold language, theme, board colors, piece style, move notation (standard `Nf3`, figurine `♘f3`, coordinates `g1f3`), "always promote to a queen", engine size and keyboard shortcuts on/off. **Lite** is the default engine; **Full** (~94 MB, strongest, cached after the first download) asks first and warns on phones, low-memory devices and browsers without threads. A new engine size applies to the next calculation.
- **Keyboard shortcuts**: `F` flip the board, `Ctrl/⌘+Z` undo, `Ctrl/⌘+Shift+Z` redo, `M` edit/play, `←`/`→` previous/next move, `Shift+←`/`Shift+→` first/last move, `Ctrl/⌘+Enter` calculate or stop, `?` the list. They never run while you type in a field, and can be turned off in the settings. Each feature registers its own with `useShortcuts` (see `src/ui/shortcuts`), so the help dialog lists whatever exists.
- **Saved boards** (panel): name the board on screen (with its moves, if it has any, and which side is at the bottom), load it later, rename or delete it. Up to 100, kept in this browser.
- **Persistence is versioned.** Every persisted store (`nmc-theme`, `nmc-locale`, `nmc-analysis`, `nmc-settings`, `nmc-saved-boards`) carries a schema `version`. To change a schema: bump the version, add `migrations[oldVersion]` (see `state/savedBoards.ts`, which went from version 1 to 2), and add a test that loads the old payload. Corrupt or newer data is repaired field by field, never dropped wholesale. See [ADR 0010](docs/adr/0010-settings-persistence-shortcuts.md).

## Design system

- **Tokens** live in [`src/ui/styles/tokens/`](src/ui/styles/tokens) (colors per theme, board, typography, shape, layout, motion, z-index) and are mapped into Tailwind by `src/ui/styles/theme.css`. Components use only those utilities; `npm test` rejects raw colors and px/rem values outside token files, mismatched light/dark token sets and WCAG AA contrast failures.
- **Re-theme** by editing token files only. Add a theme by defining the same token names under a new selector; board themes use `[data-board-theme="..."]`.
- **Theme** is `system` (default), `light` or `dark`, switchable in the settings dialog; it follows the OS live and is remembered.
- **Primitives** (shadcn/ui, restyled via tokens) are in `src/ui/primitives`, each with a Storybook story. Controls are compact for mouse and >= 44 px on touch.
- **Storybook** (`npm run storybook`) has theme and locale toolbars and the viewport toolbar for phone/tablet/desktop.

## Shell and panels

The shell (`src/app/Shell.tsx`, `src/ui/layout`) has a header, a board slot and a panel slot: stacked with the board first on phones and portrait tablets, side by side on desktop and in landscape. New panels are registered, never added to the shell:

```ts
import { registerPanel } from '@/app'

registerPanel({ id: 'analysis', order: 10, component: AnalysisPanel })
```

Call it from `registerDefaultPanels` in `src/app/panels/defaults.ts`.

## Internationalisation

Every string goes through `useTranslation()`. Core strings are in `src/i18n/locales`; a feature registers its own namespace with `registerTranslations`. English is the default; Brazilian Portuguese (pt-BR) is complete, and `src/app/translations.test.ts` fails if any namespace misses a key, a `{{placeholder}}` or a translation. To add a language, add a locale file per namespace and list it in `src/i18n/locales.ts`. See [ADR 0004](docs/adr/0004-i18n.md).

## Hosting requirements

The build is a static bundle. For multi-threaded Stockfish (`SharedArrayBuffer`) any host must serve every response with:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Without these the app falls back to single-threaded mode. The host must also serve `engine/*.wasm` (up to ~99 MB per file; Full builds are in `dist/engine/`) and allow same-origin blob workers. Hosting itself is out of scope until the app is finished.

## License

[GPL-3.0](LICENSE)
