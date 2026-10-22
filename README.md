# Next-Move Calculator

Open-source web app, inspired by nextchessmove.com: set up any chess position and get the best move(s), evaluation and lines, computed 100% in your browser on phone, tablet and desktop. No backend.

> Status: design system, app shell and chess core done. The editor, analysis and saved-boards features are not implemented yet.

## Requirements

- Node.js 24 (LTS), see `.nvmrc`
- npm

## Getting started

```sh
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script                                  | What it does                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `preview`               | Dev / production-preview server (both send COOP/COEP)                                                       |
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
  state/     Zustand stores (theme, locale; persisted and versioned)
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

## Design system

- **Tokens** live in [`src/ui/styles/tokens/`](src/ui/styles/tokens) (colors per theme, board, typography, shape, layout, motion, z-index) and are mapped into Tailwind by `src/ui/styles/theme.css`. Components use only those utilities; `npm test` rejects raw colors and px/rem values outside token files, mismatched light/dark token sets and WCAG AA contrast failures.
- **Re-theme** by editing token files only. Add a theme by defining the same token names under a new selector; board themes use `[data-board-theme="..."]`.
- **Theme** is `system` (default), `light` or `dark`, switchable in the header; it follows the OS live and is remembered.
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

Every string goes through `useTranslation()`. Core strings are in `src/i18n/locales`; a feature registers its own namespace with `registerTranslations`. To add a language, add a locale file and list it in `src/i18n/locales.ts`. See [ADR 0004](docs/adr/0004-i18n.md).

## Hosting requirements

The build is a static bundle. For multi-threaded Stockfish (`SharedArrayBuffer`) any host must serve every response with:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Without these the app falls back to single-threaded mode. Hosting itself is out of scope until the app is finished.

## License

[GPL-3.0](LICENSE)
