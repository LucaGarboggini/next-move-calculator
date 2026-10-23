import { expect, test, type Locator, type Page } from '@playwright/test'

// The text-symbol (glyph) piece theme: every glyph is centred in its board square and palette
// slot, measured on real screenshots, and the look is guarded by per-project snapshots.

const PIECES = [
  { name: 'white king', role: 'king', color: 'white' },
  { name: 'white queen', role: 'queen', color: 'white' },
  { name: 'white rook', role: 'rook', color: 'white' },
  { name: 'white bishop', role: 'bishop', color: 'white' },
  { name: 'white knight', role: 'knight', color: 'white' },
  { name: 'white pawn', role: 'pawn', color: 'white' },
  { name: 'black king', role: 'king', color: 'black' },
  { name: 'black queen', role: 'queen', color: 'black' },
  { name: 'black rook', role: 'rook', color: 'black' },
  { name: 'black bishop', role: 'bishop', color: 'black' },
  { name: 'black knight', role: 'knight', color: 'black' },
  { name: 'black pawn', role: 'pawn', color: 'black' },
] as const

/** Ink may sit this far from the centre, as a share of the box, plus one pixel for rounding. */
const TOLERANCE = 0.03

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })
const palette = (page: Page) => page.getByRole('region', { name: 'Pieces' })

interface Ink {
  /** Size of the measured box, in screenshot pixels. */
  width: number
  height: number
  /** How far the centre of the ink is from the centre of the box, in screenshot pixels. */
  dx: number
  dy: number
}

/**
 * Where the ink sits in a screenshot of `target`: every pixel that differs clearly from the
 * top-left corner (the background) counts as ink. Decoded in the page, so no PNG library is
 * needed and each browser decodes its own screenshot.
 */
async function inkOf(page: Page, target: Locator): Promise<Ink> {
  const png = (await target.screenshot()).toString('base64')
  return page.evaluate(async (data) => {
    const image = new Image()
    image.src = `data:image/png;base64,${data}`
    await image.decode()
    const { width, height } = image
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, width, height).data
    const background = [pixels[0], pixels[1], pixels[2]]
    let [left, top, right, bottom] = [width, height, -1, -1]
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const difference = Math.max(
          ...background.map((value, channel) => Math.abs(pixels[i + channel] - value)),
        )
        if (difference < 64) continue
        left = Math.min(left, x)
        right = Math.max(right, x)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
      }
    }
    if (right < 0) throw new Error('No ink in the screenshot')
    return {
      width,
      height,
      dx: (left + right + 1) / 2 - width / 2,
      dy: (top + bottom + 1) / 2 - height / 2,
    }
  }, png)
}

function expectCentred(ink: Ink, label: string) {
  expect
    .soft(Math.abs(ink.dx), `${label}: horizontal offset of ${ink.width} px box`)
    .toBeLessThanOrEqual(ink.width * TOLERANCE + 1)
  expect
    .soft(Math.abs(ink.dy), `${label}: vertical offset of ${ink.height} px box`)
    .toBeLessThanOrEqual(ink.height * TOLERANCE + 1)
}

test.describe('text-symbol pieces', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'nmc-settings',
        JSON.stringify({ version: 1, state: { pieceTheme: 'glyph' } }),
      )
    })
    await page.goto('/')
    await expect(board(page)).toHaveAttribute('data-piece-theme', 'glyph')
    // Nothing is drawn until the bundled font is in (font-display: block).
    await expect
      .poll(() => page.evaluate(() => document.fonts.check('16px "Chess Glyphs"', '\u265A\uFE0E')))
      .toBe(true)
    await page.evaluate(() => document.fonts.ready)
  })

  test('are drawn with the bundled font, not emoji', async ({ page }) => {
    const glyph = await page
      .locator('cg-board piece.pawn.black')
      .first()
      .evaluate((piece) => {
        const style = getComputedStyle(piece, '::before')
        return {
          // Browsers differ on quoting the family name.
          family: style.fontFamily.replaceAll('"', ''),
          content: style.content,
          loaded: [...document.fonts].some(
            (face) =>
              face.family.replaceAll('"', '') === 'Chess Glyphs' && face.status === 'loaded',
          ),
        }
      })
    expect(glyph).toEqual({ family: 'Chess Glyphs', content: '"\u265F\uFE0E"', loaded: true })
  })

  test('are centred in their board squares', async ({ page }) => {
    // Measure each piece on a plain background: no square colors (a screenshot can catch a
    // sliver of the next square) and no coordinates (they share the edge squares).
    await page.addStyleTag({
      content: 'cg-board { background: none !important; } .cg-wrap coords { visibility: hidden; }',
    })
    for (const { name, role, color } of PIECES) {
      const piece = page.locator(`cg-board piece.${role}.${color}`).first()
      expectCentred(await inkOf(page, piece), `${name} on the board`)
    }
  })

  test('are centred in their palette slots', async ({ page }) => {
    for (const { name } of PIECES) {
      const icon = palette(page)
        .getByRole('button', { name, exact: true })
        .locator('[data-slot="piece-icon"]')
      await icon.scrollIntoViewIfNeeded()
      expectCentred(await inkOf(page, icon), `${name} in the palette`)
    }
  })

  test('look the same as the reviewed snapshots', async ({ page }) => {
    await expect(board(page)).toHaveScreenshot('glyph-board.png')
    await palette(page).scrollIntoViewIfNeeded()
    await expect(palette(page)).toHaveScreenshot('glyph-palette.png')
  })
})
