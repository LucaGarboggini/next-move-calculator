// The part of opentype.js (which ships no types) that tools/glyph-font.test.ts reads.
declare module 'opentype.js' {
  export interface BoundingBox {
    x1: number
    y1: number
    x2: number
    y2: number
  }

  export interface Glyph {
    index: number
    advanceWidth: number
    path: { commands: unknown[] }
    getBoundingBox(): BoundingBox
  }

  export interface Font {
    unitsPerEm: number
    tables: {
      hhea: { ascender: number; descender: number; lineGap: number }
      os2: {
        sTypoAscender: number
        sTypoDescender: number
        sTypoLineGap: number
        usWinAscent: number
        usWinDescent: number
        fsSelection: number
      }
    }
    charToGlyph(char: string): Glyph
  }

  export function parse(buffer: ArrayBuffer): Font

  const opentype: { parse: typeof parse }
  export default opentype
}
