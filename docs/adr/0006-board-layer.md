# 0006 — Board layer: BoardView interface over chessground

Status: accepted

## Context

The board must work with touch, mouse, pen and keyboard, support playing, editing and read-only display, and be themeable. Chessground does the heavy lifting but must stay swappable and invisible to features (ADR 0002).

## Decision

- **`BoardView` interface** (`board/types.ts`) is the contract: a plain `BoardViewState` (pieces, orientation, mode, legal destinations, last move, check, arrows, highlights, edit tool, coordinates, animations) in; `onMove` / `onEdit` / `onSquareSelect` out. `chessground-adapter.ts` is the only file importing chessground (enforced by lint); the React `Board` takes a `createView` factory, so another renderer can replace it.
- **Controlled board.** It shows exactly the props given. After every user move the wrapper re-applies the props, so a move the host rejects snaps back. Legality comes from core (`Position.destinations()`); the board never knows chess rules.
- **Modes.** `view` (display), `play` (legal moves for `movableColor`; the wrapper shows a promotion picker and reports `Move` with `promotion`), `edit` (free moves, drag off the board to delete, an `EditTool` places or erases on tap, `dragNewPiece` for palettes; castling is not applied automatically).
- **Castling** is the king's two-square move (`e1g1`), as in core and UCI; the board never uses king-takes-rook.
- **Keyboard and screen readers.** Chessground has no keyboard support, so the wrapper adds a roving cursor (arrows, Home/End/PageUp/PageDown, Enter/Space, Escape, Delete in edit mode) built on `selectSquare`, and a polite live region announces squares, selections and moves. The visual layer is `aria-hidden`.
- **No right-click-only actions.** Users cannot draw shapes; arrows come from props only. Dragging on an interactive board never scrolls the page (`touch-action: none`, `blockTouchScroll`); a view-only board may scroll.
- **Themes are tokens.** Board themes are token sets in `ui/styles/tokens/board.css` selected by `data-board-theme` (green, brown, blue); the squares are a CSS gradient over those tokens. Piece themes are CSS selected by `data-piece-theme` (`classic` SVG sprites, `glyph` Unicode colored by tokens). Arrows use `var(--board-arrow-*)`, so they follow themes and dark mode.
- **Strings through context.** The board cannot import i18n (it sits beside it), so messages arrive via `BoardMessagesContext`; the board owns its translation bundles (`boardTranslations`, namespace `board`) and the app registers them and provides the context (`BoardI18nProvider`).
- **Sprites.** The classic pieces are the cburnett set (GPL-2.0-or-later) shipped with chessground, extracted to `board/styles/pieces/classic/`.

## Consequences

- Features use `<Board>` and `PieceIcon` only; swapping chessground touches one file.
- Chessground fires its callbacks on timers, so edit events are told apart from programmatic updates by comparing piece sets, not by flags.
- Squares are `board width / 8` wide, so on a 320 px phone they are 40 px: below the 44 px target, which an 8x8 board cannot meet. Palettes and the promotion picker use >= 44 px controls.
