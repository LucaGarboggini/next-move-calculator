# 0019 — Auto-move

Status: accepted.

## Context

Players asked for the engine's best move to be played for them, so they can play a whole game against it, or play its line out move by move. Playing a move on its own must never surprise anyone. A manual Stop must not move. The lines on screen must always match the board. The new position must not start a search by itself (ADR 0009 keeps recalculation manual). Castling and promotion must come out exactly as the engine meant them.

## Decision

- **A search setting.** `autoMove` (off by default) sits in the analysis settings store next to the limits it depends on, and its switch is in the Search settings panel. The store went from version 1 to 2. `migrations[1]` adds `autoMove: false`, so anyone upgrading keeps every other setting and starts with auto-move off.
- **Only a search that reached its limits moves.** `AnalysisController.onComplete(listener)` reports a search that ended with the engine's `completed` reason, after its result has been published. It passes the searched `Position` and the engine's final `bestmove`. Stop, the tab going to the background, a position change and a replaced or failed search detach the run before the engine answers, so they can never reach the listener, even though Stockfish still sends a `bestmove` after `stop`.
- **The provider plays it.** `AnalysisProvider` subscribes, reads `autoMove` at that moment, checks that the board still shows the searched position, and calls `playOnBoard`. That is the path the best-move button and the engine lines use: `editor.playMoves` (one undo step, legal moves only, so castling as the king's two-square move and promotion with the engine's piece, even with "always promote to a queen" on), then play mode. The setting is read live: turning it off during a search stops that search from moving. The other search settings still apply from the next calculation, and the panel says so.
- **No stale lines, no new search.** Playing the move changes the position. The provider's existing reset then clears the result, and `useCurrentResult` hides it at once anyway because its FEN no longer matches. Nothing starts a search, so the user is back at "Press Calculate".
- **Infinite time.** "Until stopped" with no depth limit never ends by itself, and a Stop never moves. In that case the switch stays usable (the choice is kept), but its description changes to say it needs a time or depth limit (`endsByItself`). "Until stopped" with a depth limit does end by itself, so auto-move works with it.

## Consequences

- Auto-move works after Calculate from the button or from `Ctrl/⌘+Enter`, on every input, because it hooks into the end of the search, not into the button.
- Undo after an auto-move restores the position and clears nothing else; it does not recalculate either.
- `e2e/auto-move.spec.ts` runs on all seven projects with the real engine. It covers off by default, on with a depth limit and with a time limit (no second search starts), Stop, the explanation for infinite time, persistence across a reload, all four castlings and three promotions (queen for each color, knight underpromotion). The promotion positions are checked against Stockfish in `src/engine/stockfish/promotion.test.ts`, where one promotion piece wins at every depth and every other piece draws or loses.
