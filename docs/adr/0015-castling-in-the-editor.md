# 0015 — Castling in the position editor

Status: accepted

## Context

The app opens in **Edit position** mode. There, moving the king from e1 to c1 (or e8 to c8, or either king-side) moved only the king: the rook stayed in its corner and the castling rights stayed set. Validation then flagged rights the pieces could no longer hold, and the position could not be analyzed. Users read this as "O-O-O does not work". Play mode, PGN, FEN and engine moves were already correct (ADR 0005); the edit path was the gap.

The board could not fix this by itself. It only knows pieces, not castling rights, so it cannot tell a castling move from a king being repositioned. It also reported only the new piece map, not which piece moved. Chessground's own `autoCastle` checks neither the rights nor the squares in between, so ADR 0006 keeps it off in edit mode.

## Decision

- **Core owns the editing rules.** `movePiece(setup, from, to)` moves a piece anywhere, replacing what is there, and does not change the side to move. A king's two-file move from e1/e8 castles when that right is set and the squares between king and rook are empty: the rook moves to d/f. Castling through or out of check is not checked, because a setup need not be legal. `placePieces(setup, pieces)` replaces the pieces. Both drop every castling right the new pieces can no longer hold, as moving the king or rook would in a game. Castling therefore uses up both of that color's rights.
- **The board reports the move.** In edit mode, `onEdit(pieces, move?)` carries `{ from, to }` when one piece was moved on the board. It is not set for palette drops, tools, the Delete key or dragging a piece off. The board still never moves a second piece.
- **The editor store applies it.** `setPieces(pieces, move?)` uses `movePiece` when a move is given and `placePieces` otherwise; a castling is one undo step.

## Consequences

- Moving the king or a corner rook in the editor clears the matching rights, even if the piece is moved back. The checkboxes can switch them on again.
- A loaded FEN with impossible rights is still shown with its errors ("invalid is visible", ADR 0007) until the pieces are edited or the right is switched off.
- Regression coverage, for both sides and both colors: core (`setup`, `position`, `pgn`), the board adapter, the editor store, the real engine (`engine/stockfish/castling.test.ts`), and `e2e/castling.spec.ts` on every device profile (editor and play mode by tap/click and drag, PGN, FEN rights, engine-played moves).
