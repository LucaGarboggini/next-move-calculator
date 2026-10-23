# 0017 — Text-symbol pieces

Status: accepted

## Context

With the text-symbol (`glyph`) piece theme, the symbols sat off-centre on the board and in the palette, by different amounts in each browser. Three things caused it:

- **The font came from the platform.** `font-family: system-ui` resolved to a different symbol font on each OS (or fell back per glyph), each with its own glyph shapes and line metrics.
- **Centring used the line box, not the ink.** With `line-height: 1`, a browser places the baseline using the font's ascent and descent (hhea on macOS, win or typo metrics on Windows, typo with `USE_TYPO_METRICS`). Noto Sans Symbols 2, for example, has ascent 1069 and descent 630 per 1000 units, so its chess symbols drew about 14% of the square above centre. Flex centring of the box could not correct for that.
- **The palette slot was not square.** `cn` does not know the project's `h-control-md` utility conflicts with `size-11`, so it kept the button's 36 px height on desktop pointers. The piece box was 34 × 26 px, glyphs were sized by its width, and the classic sprites were cropped.

Black pawn (U+265F) also has an emoji form, which iOS may substitute unless text presentation is requested.

## Decision

- **One bundled font.** `scripts/build-glyph-font.mjs` (`npm run fonts:glyphs`) builds `board/styles/pieces/glyph/chess-glyphs.otf` (6 kB) from the six filled chess symbols of Noto Sans Symbols 2 (OFL-1.1, the `@fontsource/noto-sans-symbols-2` dev dependency) with opentype.js. The theme uses only this font (`font-display: block`, so no fallback font with other metrics ever draws). The output is committed beside its licence (`OFL.txt`) and is byte-for-byte reproducible.
- **Centring is built into the font.** Each glyph is moved so its ink bounding box is centred in a 1000 × 1000 em box. Ascender 800 and descender −200 sum to the em, with no line gap, and are the same in hhea, typo and win metrics (`USE_TYPO_METRICS` set). With `line-height: 1` the line box is exactly the em box on every platform, so flex centring of a `1em × 1em` box centres the ink. The CSS does not compensate for any font metrics.
- **Text presentation is requested twice.** Every symbol is followed by U+FE0E, and the font maps U+FE0E to an empty zero-width glyph so the whole sequence stays in this font. `font-variant-emoji: text` is also set where supported. The theme also turns off `font-synthesis` and resets weight and style, so a bold or italic ancestor cannot distort the glyphs.
- **Square palette slots.** Palette slots add `min-h-11`, so they are 44 × 44 px on every pointer. This also meets the 44 px touch-target rule on desktop-sized touch screens.

## Consequences

- `tools/glyph-font.test.ts` checks the committed font: the metrics are equal, every glyph is centred within one unit, U+FE0E is empty, and rebuilding gives the same bytes.
- `e2e/glyph-pieces.spec.ts` runs on every Playwright project (Chromium, Firefox and WebKit, at desktop, phone and tablet sizes). It measures the ink in real screenshots of each of the 12 pieces on the board and in the palette, and fails if the ink's centre is more than 3% of the box (plus 1 px) from the centre. Before this fix it measured up to 16%; now it is at most about 1.75 CSS px of rounding. It also checks that the bundled font loaded and is used, and compares the board and the palette against reviewed snapshots.
- Snapshots are per project and per OS (`e2e/glyph-pieces.spec.ts-snapshots/*-{darwin,linux}.png`), because text antialiasing differs between macOS and Linux. Update them with `npx playwright test e2e/glyph-pieces.spec.ts --update-snapshots` after an intended visual change. The Linux baselines CI compares against are taken from the `*-actual.png` files in the failed run's `test-results` artifact.
- Using a different symbol font only means changing the source in the script and rebuilding. The CSS and the tests stay the same.
- The `cn` merge tables still do not know the `control-*` spacing utilities. Other components that combine a size variant with a `size-*` class should check the rendered size.
