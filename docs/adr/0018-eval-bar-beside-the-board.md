# 0018 — Eval bar beside the board

Status: accepted. Supersedes the eval-bar point of [ADR 0009](0009-analysis-feature.md).

## Context

The eval bar was a thin horizontal strip in the analysis panel. Beside the board, which is where players look for it, it must fit the viewport together with the board on every layout. It must follow the board orientation and show the number. It must not become a second bar next to the old one.

## Decision

- **One bar, next to the board.** `EvalBar` moved from the analysis panel to the board slot. The panel keeps the large number and the worded advantage. `app/AnalysisBoard` composes `BoardEvalBar` (analysis feature) with `EditorBoard` (editor feature) in a `ui/` `BoardStage`. Features still do not import each other.
- **Layout by slot, not by feature.** `BoardStage` has a `gauge` slot: above the board while the shell is stacked, before it (on the left) side by side. Side by side, `board-fit` subtracts `--board-fit-inset`. `board-fit-gauge` sets it to the gauge thickness plus the gap, so board and bar stay inside the board area together. Sizes are tokens: `--layout-gauge` (2.25rem, vertical), `--layout-gauge-compact` (1.5rem, horizontal) and `--layout-gauge-gap`.
- **Generic primitive.** `ui/BalanceBar` is a two-tone bar with no chess in it. It takes a value from 0 to 1, the end its light part grows `from`, an `axis` (`horizontal`, `vertical`, or `responsive`, which follows the shell's `split` breakpoint) and a short label. The light part is as large as the bar and slides with `translate`, so the change animates on the compositor (`motion-slow`, zero under reduced motion). The label sits at the outer end of the larger part, in the other part's color.
- **Orientation.** White's part grows from the end of the side at the bottom of the board: the bottom when vertical, the left when horizontal (the vertical bar turned a quarter clockwise). Flipping the board flips the bar. The value read out never depends on orientation.
- **Curve.** The bar shows White's winning chance: `1 / (1 + e^(-0.00368208 · cp))`, the curve lichess uses. +0.35 is 53%, +1 is 59%, +3 is 75%, so small evals move the bar gently. A forced mate fills it. A position on the board that is already checkmate counts as mate in 0 ("1-0" or "0-1"), and stalemate is level.
- **Number.** The bar shows `formatEvalCompact`, at most four characters (`+0.4`, `-12`, `#3`, `#-12`, `1-0`), so it fits the narrow vertical bar. The panel and screen readers get the full `formatEval`.
- **Accessibility.** The bar is a `meter` named "Who's winning". `aria-valuenow` is White's chance in percent. `aria-valuetext` gives the eval and who is ahead ("Evaluation +0.35: White is ahead"), or "No evaluation yet". It is not a live region, because the panel's status already announces the search.
- **No stale value.** The bar reads `useCurrentResult`, which compares the result's FEN with the board's. It shows the level, unlabelled bar while there is no evaluation, so the board never shifts when one arrives.

## Consequences

- Side by side, the board is 44 px narrower wherever its width, not the height, is the limit (e.g. landscape tablets). The text-symbol snapshot of that project was re-baselined.
- `e2e/eval-bar.spec.ts` runs on all seven projects. It checks the placement and that board and bar fit the viewport, flipping (measured on the moving part), the cp curve against the real engine, mate for either side, the checkmate result, a level stalemate, and axe in both themes.
