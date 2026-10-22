# 0002 — Layered architecture enforced by lint

Status: accepted

## Context

The UI must be redesignable and features addable without rewrites. Convention alone erodes, so the dependency direction is enforced mechanically.

## Decision

```
app → features → (ui, board, state, i18n) → (engine, core)
```

- `core/` pure chess domain over chessops; no React, no DOM. Imports nothing.
- `engine/` `Engine` interface, Stockfish worker adapter, UCI client. May import `core`.
- `board/` `BoardView` interface, chessground adapter, React wrapper. May import `core`.
- `ui/` design system: tokens, themes, primitives, layout. Imports nothing from other layers (no chess logic).
- `i18n/` translations, locale detection, `registerTranslations`. Imports nothing.
- `state/` Zustand stores. May import `core`, `engine`, `i18n`.
- `features/{editor,analysis,settings,saved-boards}` self-contained; may import any lower layer; never each other.
- `app/` shell, providers, composition; may import everything.

Rules are generated from one table in `eslint.config.js` using `no-restricted-imports`:

1. A module may only import the modules listed for it.
2. Other modules are imported only through their public `index.ts` (no deep imports); this applies to both `@/…` and relative `../…` specifiers.
3. Vendor libraries live behind their adapter: `chessground` → `board`, `chessops` → `core` and `board`, `stockfish` → `engine`.

`tools/layer-rules.test.ts` lints sample violations so the rules themselves are regression-tested.

## Consequences

- Inside a module, use relative imports or its own `@/module/…` path; to reach another module, import its index.
- Relative cross-module imports are detected by path shape (`../**/<module>`), so avoid naming internal folders after a layer (e.g. a `ui/` folder inside a feature) when reached via `../`.
- `board` and `state` get chessops types via `core` where possible; `board` is allowed chessops directly because chessground's key/dests types pair with it.
