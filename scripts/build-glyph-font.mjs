// Builds the font for the `glyph` piece theme: the six filled chess symbols from Noto Sans
// Symbols 2 (OFL-1.1), each moved so its ink is centred in a square em box, with line metrics
// equal to the em. With `line-height: 1` the line box is then the em box on every platform,
// so the glyphs centre without depending on platform font metrics. U+FE0E maps to an empty
// glyph so the font covers the whole `U+265A U+FE0E` text-presentation sequence.
//
// The output is committed (it is a few kB); rerun with `npm run fonts:glyphs` after changing
// this script or the source package. tools/glyph-font.test.ts checks the result and that it
// matches what this script builds. Pass a path to write somewhere else.
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import opentype from 'opentype.js'

const require = createRequire(import.meta.url)
const SOURCE =
  require.resolve('@fontsource/noto-sans-symbols-2/files/noto-sans-symbols-2-symbols-400-normal.woff')
const OUT = join(import.meta.dirname, '..', 'src/board/styles/pieces/glyph/chess-glyphs.otf')

const UNITS_PER_EM = 1000
// Baseline 80% down the em box; the vertical centre of the em is then 300 units above it.
const ASCENDER = 800
const DESCENDER = ASCENDER - UNITS_PER_EM
const CENTER_X = UNITS_PER_EM / 2
const CENTER_Y = ASCENDER - UNITS_PER_EM / 2

// King, queen, rook, bishop, knight, pawn (black symbols; the theme colors them per side).
const CODE_POINTS = [0x265a, 0x265b, 0x265c, 0x265d, 0x265e, 0x265f]
const TEXT_PRESENTATION = 0xfe0e

const buffer = readFileSync(SOURCE)
const source = opentype.parse(
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
)

/** The source glyph moved so the centre of its ink is the centre of the em box. */
function centred(codePoint) {
  const glyph = source.charToGlyph(String.fromCodePoint(codePoint))
  if (glyph.index === 0) throw new Error(`Source font has no U+${codePoint.toString(16)}`)
  const box = glyph.getBoundingBox()
  const dx = Math.round(CENTER_X - (box.x1 + box.x2) / 2)
  const dy = Math.round(CENTER_Y - (box.y1 + box.y2) / 2)
  const path = new opentype.Path()
  for (const command of glyph.path.commands) {
    const moved = { ...command }
    for (const [x, y] of [
      ['x', 'y'],
      ['x1', 'y1'],
      ['x2', 'y2'],
    ]) {
      if (x in moved) moved[x] += dx
      if (y in moved) moved[y] += dy
    }
    path.commands.push(moved)
  }
  return new opentype.Glyph({
    name: `uni${codePoint.toString(16).toUpperCase()}`,
    unicode: codePoint,
    advanceWidth: UNITS_PER_EM,
    path,
  })
}

const glyphs = [
  new opentype.Glyph({ name: '.notdef', advanceWidth: UNITS_PER_EM, path: new opentype.Path() }),
  ...CODE_POINTS.map(centred),
  new opentype.Glyph({
    name: 'uniFE0E',
    unicode: TEXT_PRESENTATION,
    advanceWidth: 0,
    path: new opentype.Path(),
  }),
]

const font = new opentype.Font({
  familyName: 'Chess Glyphs',
  styleName: 'Regular',
  unitsPerEm: UNITS_PER_EM,
  ascender: ASCENDER,
  descender: DESCENDER,
  copyright: 'Copyright 2022 The Noto Project Authors (https://github.com/notofonts/symbols)',
  description: 'Chess symbols from Noto Sans Symbols 2, centred in the em box.',
  license: 'This Font Software is licensed under the SIL Open Font License, Version 1.1.',
  licenseURL: 'https://openfontlicense.org',
  version: '1.000',
  glyphs,
  tables: {
    os2: {
      // Windows line metrics equal the typographic ones, which every platform should use.
      usWinAscent: ASCENDER,
      usWinDescent: -DESCENDER,
      fsSelection: 0x40 /* REGULAR */ | 0x80 /* USE_TYPO_METRICS */,
    },
  },
})

/** Sum of a byte range as big-endian 32-bit words, as OpenType checksums are defined. */
function checksum(view, offset, length) {
  let sum = 0
  for (let i = offset; i < offset + length; i += 4) {
    let word = 0
    for (let byte = 0; byte < 4; byte++) {
      word = word * 256 + (i + byte < view.byteLength ? view.getUint8(i + byte) : 0)
    }
    sum = (sum + word) >>> 0
  }
  return sum
}

/**
 * opentype.js stamps the current time into the `head` table. Zero both timestamps and redo the
 * checksums, so rebuilding from the same source gives the same bytes.
 */
function withoutTimestamps(buffer) {
  const view = new DataView(buffer)
  const tables = view.getUint16(4)
  for (let i = 0; i < tables; i++) {
    const record = 12 + i * 16
    if (String.fromCharCode(...new Uint8Array(buffer, record, 4)) !== 'head') continue
    const offset = view.getUint32(record + 8)
    const length = view.getUint32(record + 12)
    view.setBigUint64(offset + 20, 0n) // created
    view.setBigUint64(offset + 28, 0n) // modified
    view.setUint32(offset + 8, 0) // checkSumAdjustment is left out of every checksum
    view.setUint32(record + 4, checksum(view, offset, length))
    view.setUint32(offset + 8, (0xb1b0afba - checksum(view, 0, view.byteLength)) >>> 0)
    return buffer
  }
  throw new Error('No head table')
}

const out = process.argv[2] ?? OUT
writeFileSync(out, Buffer.from(withoutTimestamps(font.toArrayBuffer())))
console.log(`Wrote ${out}`)
