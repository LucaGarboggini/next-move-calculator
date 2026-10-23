// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import opentype from 'opentype.js'

// The glyph piece theme centres its symbols only because of how this font is built: each glyph's
// ink centred in the em box and line metrics equal to the em, the same on every platform.

const FONT = 'src/board/styles/pieces/glyph/chess-glyphs.otf'
const SYMBOLS = ['♚', '♛', '♜', '♝', '♞', '♟']
const USE_TYPO_METRICS = 0x80

const bytes = readFileSync(FONT)
const font = opentype.parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
)
const em = font.unitsPerEm
const { hhea, os2 } = font.tables

describe('chess glyph font', () => {
  it('has line metrics equal to the em on every platform', () => {
    expect(hhea.ascender - hhea.descender).toBe(em)
    expect(hhea.lineGap).toBe(0)
    expect([os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap]).toEqual([
      hhea.ascender,
      hhea.descender,
      0,
    ])
    expect([os2.usWinAscent, -os2.usWinDescent]).toEqual([hhea.ascender, hhea.descender])
    expect(os2.fsSelection & USE_TYPO_METRICS).toBe(USE_TYPO_METRICS)
  })

  it.each(SYMBOLS)('centres the ink of %s in a square em box', (symbol) => {
    const glyph = font.charToGlyph(symbol)
    expect(glyph.index).toBeGreaterThan(0)
    expect(glyph.advanceWidth).toBe(em)
    const box = glyph.getBoundingBox()
    // The middle of the line box is half an em below the ascender; moves are whole units.
    expect(Math.abs((box.x1 + box.x2) / 2 - em / 2)).toBeLessThanOrEqual(1)
    expect(Math.abs((box.y1 + box.y2) / 2 - (hhea.ascender - em / 2))).toBeLessThanOrEqual(1)
    expect(box.y2).toBeLessThanOrEqual(hhea.ascender)
    expect(box.y1).toBeGreaterThanOrEqual(hhea.descender)
  })

  it('maps the text-presentation selector to an empty, zero-width glyph', () => {
    const selector = font.charToGlyph('\uFE0E')
    expect(selector.index).toBeGreaterThan(0)
    expect(selector.advanceWidth).toBe(0)
    expect(selector.path.commands).toEqual([])
  })

  it('is what scripts/build-glyph-font.mjs builds', () => {
    const dir = mkdtempSync(join(tmpdir(), 'glyph-font-'))
    try {
      const rebuilt = join(dir, 'chess-glyphs.otf')
      execFileSync(process.execPath, ['scripts/build-glyph-font.mjs', rebuilt])
      expect(readFileSync(rebuilt).equals(bytes)).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
