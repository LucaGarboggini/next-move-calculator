# 0009 — Analysis feature: controller, throttled output, board overlay by composition

Status: accepted

## Context

The analysis feature must stream engine output without janking a phone, never show a result for a position other than the one on the board, and put arrows on a board that belongs to the editor feature, while features may not import each other.

## Decision

- **`AnalysisController`** (`features/analysis/controller.ts`, no React) runs one search at a time on an `Engine` and publishes to a Zustand session store (`state/analysis.ts`). Only the _current_ run can write; a run that was stopped, replaced or reset is detached immediately, so a late event cannot show a stale result.
- **Output is coalesced.** The engine can emit hundreds of `info` lines per second. The controller keeps the newest line per variation and updates the store at most every 100 ms (leading edge immediate, trailing flush at the end). SAN is computed at flush time only for lines that changed, and unchanged lines keep their object identity so memoised rows do not re-render.
- **A result belongs to one position.** The result stores the canonical `Position.fen`. `AnalysisProvider` resets the controller when that FEN changes, and selectors also compare FENs, so not even one frame shows an old result next to a new position. (The editor's `fen` is not canonical: the en passant square differs, so it is not used for comparison.)
- **Manual recompute only.** Nothing starts a search except the Calculate button. Playing an engine move changes the position, which clears the analysis; the user presses Calculate again.
- **Background tabs.** On `visibilitychange` to hidden the search is stopped with status `backgrounded`; the best result so far stays and a message says why.
- **Settings** (`useAnalysisSettings`, persisted, versioned, sanitised on every write and migration): time 1–60 s or infinite, optional depth (both limits may be set; first reached wins), MultiPV 1–5, threads and hash. Threads and hash are `null` ("device recommendation") until the user changes them, so a persisted value never overrides what a different device can afford. The threads control only exists when the browser can run threads; the engine clamps to bounds anyway.
- **Board overlay by composition.** `EditorBoard` takes an `arrows` prop; `app/AnalysisBoard` joins it with `useAnalysisArrows()` from the analysis feature. Features stay independent; the composition root is the only place that knows both. Secondary arrows are thin brushes, which are also fainter (opacity 0.6).
- **Playing a line.** Moves in a line are buttons; picking one plays the line up to it through `useEditorStore.playMoves`, one undo step, and switches the editor to "Play moves".
- **Eval bar** is horizontal, in the analysis panel, with the number and a worded advantage next to it. A vertical bar beside the board would take space from a board that must always fit the viewport; the component is independent of orientation and can move into the board slot in a redesign. Share = logistic function of centipawns (same curve as lichess); a forced mate fills the bar.

## Consequences

- The controller is tested with a scripted `FakeEngine` (also used by stories), including throttling, supersession, stop, background and failure; the real engine is covered by `e2e/analysis.spec.ts` in all seven browser/device projects, including a frame-gap check while a five-line search streams.
- Evaluation always comes from White's point of view (`toWhiteScore` at flush time); the side to move is shown in the panel.
- Lines are shown up to 16 plies; the engine's full line is kept in the store.
