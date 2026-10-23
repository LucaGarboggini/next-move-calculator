import { expect, test, type Page } from '@playwright/test'

// The spare-piece palette with every input: taps (touch) or clicks (mouse) to pick a piece and
// place it, and drags onto and off the board.

const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1'

const PIECES = [
  { name: 'white king', fen: 'K' },
  { name: 'white queen', fen: 'Q' },
  { name: 'white rook', fen: 'R' },
  { name: 'white bishop', fen: 'B' },
  { name: 'white knight', fen: 'N' },
  { name: 'white pawn', fen: 'P' },
  { name: 'black king', fen: 'k' },
  { name: 'black queen', fen: 'q' },
  { name: 'black rook', fen: 'r' },
  { name: 'black bishop', fen: 'b' },
  { name: 'black knight', fen: 'n' },
  { name: 'black pawn', fen: 'p' },
] as const

/** Room for two of each piece type. */
const SQUARES = [3, 4, 5, 6].flatMap((rank) => [...'abcdefgh'].map((file) => `${file}${rank}`))

type Point = { x: number; y: number }

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })
const fenBox = (page: Page) => page.getByRole('textbox', { name: 'FEN or PGN' })
const palette = (page: Page) => page.getByRole('region', { name: 'Pieces' })
const paletteStatus = (page: Page) => palette(page).getByRole('status')
const spare = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

/** The FEN of an editor position with these pieces, White to move and nothing else set. */
function fenOf(pieces: Readonly<Record<string, string>>): string {
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1].map((rank) => {
    let row = ''
    let empty = 0
    for (const file of 'abcdefgh') {
      const piece = pieces[`${file}${rank}`]
      if (!piece) empty++
      else {
        row += (empty || '') + piece
        empty = 0
      }
    }
    return row + (empty || '')
  })
  return `${ranks.join('/')} w - - 0 1`
}

/** Center of a square in the viewport (board shown from White's side), as laid out now. */
async function squareCenter(page: Page, square: string): Promise<Point> {
  const box = (await board(page).boundingBox())!
  const file = 'abcdefgh'.indexOf(square[0] ?? '')
  const rank = Number(square[1]) - 1
  return {
    x: box.x + ((file + 0.5) * box.width) / 8,
    y: box.y + ((7 - rank + 0.5) * box.height) / 8,
  }
}

const center = async (page: Page, name: string): Promise<Point> => {
  const box = (await spare(page, name).boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

/** Taps (touch) or clicks (mouse) a palette control. */
const pressControl = (page: Page, hasTouch: boolean, name: string) =>
  hasTouch ? spare(page, name).tap() : spare(page, name).click()

/** Taps (touch) or clicks (mouse) a square, with the board scrolled into view. */
async function pressSquare(page: Page, hasTouch: boolean, square: string) {
  await board(page).evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
  const box = (await board(page).boundingBox())!
  const point = await squareCenter(page, square)
  const position = { x: point.x - box.x, y: point.y - box.y }
  if (hasTouch) await board(page).tap({ position })
  else await board(page).click({ position })
}

/**
 * A one-finger drag. Chromium gets real touches through CDP. Playwright cannot hold a touch down
 * in WebKit (and WebKit, like iOS, cannot construct `Touch` objects), so there the browser's
 * sequence is replayed from script: pointer events for the palette, touch events for the board.
 */
async function touchDrag(page: Page, browserName: string, from: Point, to: Point, steps = 10) {
  const path = Array.from({ length: steps }, (_, i) => ({
    x: from.x + ((to.x - from.x) * (i + 1)) / steps,
    y: from.y + ((to.y - from.y) * (i + 1)) / steps,
  }))
  if (browserName === 'chromium') {
    const cdp = await page.context().newCDPSession(page)
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: Point[]) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: points.map((p) => ({ ...p, id: 1 })),
      })
    await touch('touchStart', [from])
    for (const point of path) await touch('touchMove', [point])
    await touch('touchEnd', [])
    await cdp.detach()
    return
  }
  await page.evaluate(
    ({ from, path }) => {
      const target = document.elementFromPoint(from.x, from.y)!
      const pointer = (type: string, { x, y }: Point) =>
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'touch',
            isPrimary: true,
            button: type === 'pointermove' ? -1 : 0,
            clientX: x,
            clientY: y,
          }),
        )
      const touch = (type: string, { x, y }: Point) => {
        const point = { identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y }
        const down = type === 'touchend' ? [] : [point]
        const event = new Event(type, { bubbles: true, cancelable: true })
        Object.defineProperties(event, {
          touches: { value: down },
          targetTouches: { value: down },
          changedTouches: { value: [point] },
        })
        target.dispatchEvent(event)
      }
      pointer('pointerdown', from)
      touch('touchstart', from)
      for (const point of path) {
        pointer('pointermove', point)
        touch('touchmove', point)
      }
      const end = path.at(-1) ?? from
      pointer('pointerup', end)
      touch('touchend', end)
    },
    { from, path },
  )
}

/** Squares whose centers can be touched now, i.e. on screen and not under the header. */
async function touchableSquares(page: Page): Promise<string[]> {
  const squares = [1, 2, 3, 4, 5, 6, 7, 8].flatMap((rank) =>
    [...'abcdefgh'].map((file) => `${file}${rank}`),
  )
  const points = await Promise.all(squares.map((square) => squareCenter(page, square)))
  const hits = await board(page).evaluate(
    (el, points) => points.map(({ x, y }) => el.contains(document.elementFromPoint(x, y))),
    points,
  )
  return squares.filter((_, i) => hits[i])
}

test.describe('spare-piece palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(board(page)).toBeVisible()
    await page.getByRole('button', { name: 'Clear board' }).click()
    await expect(fenBox(page)).toHaveValue(EMPTY)
  })

  test('picks every piece type by tap or click and places it on as many squares as wanted', async ({
    page,
    hasTouch,
  }) => {
    const placed: Record<string, string> = {}
    for (const [i, piece] of PIECES.entries()) {
      await pressControl(page, hasTouch, piece.name)
      await expect(spare(page, piece.name)).toHaveAttribute('aria-pressed', 'true')
      await expect(paletteStatus(page)).toContainText(`Placing ${piece.name}`)
      // Once picked, a piece stays picked: every tap places another one.
      for (const square of SQUARES.slice(2 * i, 2 * i + 2)) {
        await pressSquare(page, hasTouch, square)
        placed[square] = piece.fen
        await expect(fenBox(page)).toHaveValue(fenOf(placed))
      }
    }
  })

  test('erases every piece type by tap or click', async ({ page, hasTouch }) => {
    const placed = Object.fromEntries(PIECES.map((piece, i) => [SQUARES[i], piece.fen]))
    await fenBox(page).fill(fenOf(placed))
    await page.getByRole('button', { name: 'Load' }).click()
    await expect(fenBox(page)).toHaveValue(fenOf(placed))

    await pressControl(page, hasTouch, 'Erase pieces')
    await expect(spare(page, 'Erase pieces')).toHaveAttribute('aria-pressed', 'true')
    await expect(paletteStatus(page)).toContainText('Erasing')
    for (const square of Object.keys(placed)) {
      await pressSquare(page, hasTouch, square)
      delete placed[square]
      await expect(fenBox(page)).toHaveValue(fenOf(placed))
    }
    await expect(fenBox(page)).toHaveValue(EMPTY)

    await pressControl(page, hasTouch, 'Move pieces')
    await expect(paletteStatus(page)).toContainText('Pick a piece')
  })

  test('drags every piece type from the palette onto the board by touch', async ({
    page,
    hasTouch,
    browserName,
  }) => {
    test.skip(!hasTouch, 'mouse dragging is covered in editor.spec.ts')
    // On phones the palette sits below the board: show it with the board's lowest ranks above it.
    await palette(page).evaluate((el) => el.scrollIntoView({ block: 'end', behavior: 'instant' }))
    const targets = await touchableSquares(page)
    expect(targets.length).toBeGreaterThanOrEqual(PIECES.length)

    const placed: Record<string, string> = {}
    for (const [i, piece] of PIECES.entries()) {
      const square = targets[i]
      await touchDrag(
        page,
        browserName,
        await center(page, piece.name),
        await squareCenter(page, square),
      )
      placed[square] = piece.fen
      await expect(fenBox(page)).toHaveValue(fenOf(placed))
    }
    // Dragging places a copy; it does not pick the piece for taps.
    await expect(spare(page, 'Move pieces')).toHaveAttribute('aria-pressed', 'true')
  })

  test('drags every piece type off the board by touch to remove it', async ({
    page,
    hasTouch,
    browserName,
  }) => {
    test.skip(
      !hasTouch || browserName !== 'chromium',
      'needs real touches on the board, which Playwright only sends in Chromium',
    )
    const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    await fenBox(page).fill(start)
    await page.getByRole('button', { name: 'Load' }).click()
    await board(page).evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }))

    // One of each piece type, from the starting position.
    const squares = ['e1', 'd1', 'a1', 'c1', 'b1', 'a2', 'e8', 'd8', 'a8', 'c8', 'b8', 'a7']
    const box = (await board(page).boundingBox())!
    // Just below the board, or in the side gutter when the board fills the screen's height.
    const below = box.y + box.height + 24
    const offBoard =
      below < page.viewportSize()!.height
        ? { x: box.x + box.width / 2, y: below }
        : { x: box.x / 2, y: box.y + box.height / 2 }
    for (const [i, square] of squares.entries()) {
      await touchDrag(page, browserName, await squareCenter(page, square), offBoard)
      await expect(board(page).locator('piece:not(.ghost)')).toHaveCount(32 - i - 1)
    }
    // Without kings and queen-side rooks, no castling right is left.
    await expect(fenBox(page)).toHaveValue('5bnr/1ppppppp/8/8/8/8/1PPPPPPP/5BNR w - - 0 1')
  })
})
