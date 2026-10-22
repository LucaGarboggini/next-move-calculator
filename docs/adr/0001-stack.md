# 0001 — Technology stack

Status: accepted

## Context

Next-Move Calculator is a portfolio web app: the user sets up any chess position and gets best moves, evaluation and lines, computed entirely in the browser on phone, tablet and desktop. It must stay clean and absorb redesigns and new features without rewrites.

## Decision

| Concern                | Choice                                                                                     | Why                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Build / UI             | Vite + React + TypeScript (strict), npm                                                    | Fast static bundle, no backend needed                                              |
| Styling                | Tailwind CSS v4 + shadcn/ui (Radix primitives)                                             | Design tokens as CSS variables; component code is owned in the repo                |
| Component catalog      | Storybook                                                                                  | Every primitive and feature component has a story                                  |
| Board                  | chessground                                                                                | Touch/mouse/pen input, lichess-grade board                                         |
| Rules, FEN, PGN, SAN   | chessops                                                                                   | Never hand-roll move generation                                                    |
| Engine                 | Stockfish via npm `stockfish` in a Web Worker, own typed UCI client                        | Runs 100% client-side; engine files fetched at install/build time, never committed |
| State                  | Zustand                                                                                    | Small, framework-light; persisted stores are versioned with migrations             |
| i18n                   | en (default), pt-BR                                                                        | Every user-facing string goes through i18n                                         |
| Unit / component tests | Vitest + Testing Library                                                                   | Shares Vite config                                                                 |
| End-to-end             | Playwright with the real engine, desktop Chromium/Firefox/WebKit and phone/tablet profiles | Cross-browser and device coverage                                                  |
| Lint / format          | ESLint (including layer-boundary rules) + Prettier                                         | See ADR 0002                                                                       |
| CI                     | GitHub Actions: lint, typecheck, test, build (+ e2e, Storybook build)                      |                                                                                    |
| License                | GPL-3.0                                                                                    |                                                                                    |

Multi-threaded Stockfish needs `SharedArrayBuffer`, hence cross-origin isolation (COOP/COEP). Dev and preview servers send both headers; the app falls back to single-threaded mode when not isolated.

## Consequences

- Output is a static bundle. Any host must send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to enable multi-threaded mode (see README).
- Third-party libraries are confined to their adapter modules so each can be swapped without touching features.
- shadcn components are generated into `src/ui/primitives` (see `components.json`) and then owned by this repo.
