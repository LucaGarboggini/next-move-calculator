# 0016 — Spare-piece palette input

Status: accepted

## Context

On phones and tablets the editor's spare pieces could not be placed. Every press on a palette piece started a chessground drag at once (`dragNewPiece` on `pointerdown`). On touch screens chessground ends a drag by cancelling the `touchend` so no mouse events follow, and that also cancels the `click`. The tap that should pick the piece never arrived, so tap-to-place could not be used. A tap that did nothing also left no visible state. Desktop worked because a mouse release does not cancel the click.

The e2e suite missed this because `locator.click()` sends mouse events even on touch device profiles.

## Decision

- **A press is a tap until it moves.** The board layer exports `useSparePieceDrag(boardRef, piece)`, pointer handlers for any spare-piece control. The drag starts only once the pointer moves past a slop (touch 10 px, pen 6 px, mouse 4 px). A press without movement stays a normal click, so touch, mouse, pen and keyboard all pick the piece the same way. Mouse and pen pointers are captured until the drag starts; touch pointers are captured implicitly.
- **A drag is never a click.** WebKit sends the click to where the press started even when the mouse is released over the board. That click changed the tool and redrew the board before chessground reported the dropped piece (it calls back on a timer), so the drop was lost. The hook ignores the one click that follows a drag; later clicks and keyboard presses work as usual.
- **Picking stays.** A picked piece places another copy on every tap until another tool is chosen (unchanged). The picked slot gets a thick primary border and an accent fill in both themes, plus `aria-pressed`. A status line under the palette says what a tap on the board does now ("Placing black knight: …", "Erasing: …"). Pieces are removed with the eraser or by dragging them off the board.
- **This lives in the board layer**, next to `dragNewPiece`, because the click loss is chessground behaviour. Features never deal with it, and a different board library would only change the adapter and this hook.

## Consequences

- On phones and portrait tablets the palette is below the analysis panel, so the board and palette are rarely on screen together. Tap-to-place is the main flow there; dragging works when both are visible (landscape tablets, desktop, or with the page scrolled to the board's lower ranks).
- The palette blocks page scrolling where a drag starts, as before.
- `e2e/palette.spec.ts` covers every profile. It picks all 12 pieces with real taps (clicks on desktop) and places each twice, and erases all 12 piece types by tap. On touch profiles it also drags all 12 onto the board. Chromium uses real CDP touches. WebKit replays the touch sequence from script, because Playwright cannot hold a touch down there. Dragging all 12 piece types off the board runs on Android Chromium only, since chessground accepts only trusted touches on the board. The pen slop is covered by unit tests only.
