# Next-Move Calculator

Open-source web app, inspired by nextchessmove.com: set up any chess position and get the best move(s), evaluation and lines, computed 100% in your browser on phone, tablet and desktop. No backend.

> Status: project scaffold. The editor, analysis, settings and saved-boards features are not implemented yet.

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
app → features → (ui, board, state) → (engine, core)
```

Lower layers never import higher ones; this is enforced by ESLint (`eslint.config.js`) and covered by `tools/layer-rules.test.ts`. Each module exposes a public `index.ts`; other modules import only that. Third-party libraries (chessground, chessops, stockfish) are used only inside their adapter. See [`docs/adr/`](docs/adr/) for decisions.

```
src/
  core/      pure chess domain over chessops
  engine/    Engine interface, Stockfish worker adapter, UCI client
  board/     BoardView interface, chessground adapter
  ui/        design system: tokens, primitives, layout (shadcn/ui)
  state/     Zustand stores
  features/  editor, analysis, settings, saved-boards
  app/       shell, providers, panel registry
```

New panels are added with `registerPanel` in `app/`, not by editing the shell. Visual values come from design tokens in `src/ui/styles/tokens.css`.

## Hosting requirements

The build is a static bundle. For multi-threaded Stockfish (`SharedArrayBuffer`) any host must serve every response with:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Without these the app falls back to single-threaded mode. Hosting itself is out of scope until the app is finished.

## License

[GPL-3.0](LICENSE)
