# 0005 — Chess core: plain data in and out, chessops inside

Status: accepted

## Context

Features (editor, analysis, saved boards) need rules, FEN/PGN/SAN, validation and history, but the architecture forbids them from importing chessops (ADR 0002). The core must also stay free of React and the DOM.

## Decision

- **Plain data API.** `core/` exposes immutable plain types (`Setup`, `Move`, `Square` as `"e4"`, `Piece`) plus a `Position` class. Only `chessops-adapter.ts` converts to and from chessops objects, so swapping the library touches one file.
- **Moves are UCI-style with castling as the king's two-square move (`e1g1`)**, the form Stockfish speaks. chessops spells castling as "king takes own rook"; the adapter converts both ways and rejects `e1h1` as a move.
- **Standard chess only.** Variants and Chess960-style castling rooks are rejected with `unsupportedVariant` / `unsupportedCastling`.
- **No exceptions for bad input.** Fallible operations return `Result<T, ValidationIssue[]>`.
- **Validation returns all issues at once**, each with a stable `code`, a `severity` (`error` blocks analysis; `warning` is implausible but playable, e.g. nine pawns) and structured details (`color`, `square`, `side`, `ply`). `message` is an English fallback; user-facing text is produced by features through i18n keyed on `code`.
- **Castling rights and en passant are validated against the board** (chessops silently drops impossible ones). `sanitizeSetup` removes them when a caller prefers fixing over rejecting.
- **Canonical FEN.** `Position.fen` writes the en passant square only when a capture is legal (as Stockfish does); `makeFen(setup)` writes a setup exactly as given.
- **History is an immutable value** (`MoveHistory` with a cursor); undo/redo are pure functions, so Zustand stores can hold it directly. Replaying the next redo move keeps the redo stack; any other move discards it.
- **PGN** import reads the first game's mainline (variations and comments dropped) and honours `FEN`; export writes the Seven Tag Roster.
- **Evaluation**: engine scores arrive from the side to move's view; `toWhiteScore` converts and `formatEval` prints `+0.35`, `-1.20`, `0.00`, `#3` (White mates in 3), `#-3` (Black mates in 3), and `1-0` / `0-1` for a delivered checkmate.

## Consequences

- Features and the engine layer never see chessops types.
- `tools/core-purity.test.ts` guards against React/DOM imports in `core/`.
- Adding a variant later means widening `Setup` and the adapter, not the features.
