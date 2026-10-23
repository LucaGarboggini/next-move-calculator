# 0007 — Position editor

Status: accepted

## Context

Users must be able to build or paste any legal position, see why an illegal one is rejected, and export it back unchanged. The result feeds analysis (a later feature), and the board and the controls live in different shell slots.

## Decision

- **One document, snapshot undo.** The editor state is `{ setup, game }` (`state/editor.ts`): `setup` is what the board shows and need not be legal; `game` is a `MoveHistory` when the position came from a PGN or from moves played. Every change makes a new immutable document; undo/redo step through snapshots (200 deep). Stepping through the move list changes only the game cursor and is not an undo step. Editing pieces drops the game (undo restores it).
- **The store lives in `state/`** so the analysis feature can read the position without importing the editor feature. `useEditorSnapshot()` derives the FEN, all validation issues, and `position`, defined exactly when there are no errors. That is the single gate for analysis.
- **Invalid is visible, not rejected.** A well-formed FEN loads even if illegal (no kings, pawns on the back rank, ...): the board shows it and the status panel lists every reason. Only text that cannot be parsed is refused, and then nothing changes. Warnings (implausible material) do not block.
- **Export is exact.** The FEN box shows `makeFen(setup)`, which writes castling and en passant as set; parse then write returns the same string (property-tested over played games). Turning the side to move clears the en passant square; castling rights that the pieces cannot hold cannot be switched on but can be switched off. Moving pieces in the editor castles and drops rights the pieces can no longer hold (ADR 0015).
- **Input is detected, not chosen.** `importText` in core reads a FEN (first token contains `/`) or a PGN. Pasting into an unedited box loads at once; typed text loads with the button or Ctrl/Cmd+Enter.
- **Play mode** reuses the board's `play` mode with `Position.destinations()`; it is disabled while the position is illegal.
- **Slots.** The board and palette share the board's `dragNewPiece` handle through `EditorProvider` (a React context holding a ref). Panels are registered in `app/panels/defaults.ts`; the shell is unchanged apart from its panels no longer shrinking.
- **Strings.** The feature registers its own `editor` i18n namespace; issue messages are translated by issue code with a fallback to core's English message (a test requires every code in both locales).

## Consequences

- The move list is the mainline only; there are no variations or comments.
- Halfmove and move counters are preserved from pasted FENs but not editable.
- Undo history is not persisted; saved positions are the job of the saved-boards feature.
