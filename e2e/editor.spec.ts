import { expect, test, type Page } from '@playwright/test'

const STARTING = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })
const fenBox = (page: Page) => page.getByRole('textbox', { name: 'FEN or PGN' })

/** A click position inside the board for a square (board shown from White's side). */
async function tapSquare(page: Page, square: string) {
  const file = 'abcdefgh'.indexOf(square[0] ?? '')
  const rank = Number(square[1]) - 1
  // Pressing a control below the board can leave the page scrolled; measure the board in place.
  await board(page).evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
  const box = (await board(page).boundingBox())!
  await board(page).click({
    position: { x: ((file + 0.5) * box.width) / 8, y: ((7 - rank + 0.5) * box.height) / 8 },
  })
}

/** Loads text through the FEN box the way a user would: type, then press Load. */
async function loadText(page: Page, text: string) {
  await fenBox(page).fill(text)
  await page.getByRole('button', { name: 'Load' }).click()
}

test.describe('position editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(board(page)).toBeVisible()
  })

  test('shows the starting position and whose turn it is', async ({ page }) => {
    await expect(fenBox(page)).toHaveValue(STARTING)
    await expect(page.getByTestId('side-to-move')).toHaveText('White to move')
    await expect(page.getByText('Ready for analysis')).toBeVisible()
  })

  test('builds a position from the palette and exports exactly that FEN', async ({ page }) => {
    await page.getByRole('button', { name: 'Clear board' }).click()
    await expect(fenBox(page)).toHaveValue('8/8/8/8/8/8/8/8 w - - 0 1')

    const place = async (piece: string, squares: string[]) => {
      await page.getByRole('button', { name: piece, exact: true }).click()
      for (const square of squares) await tapSquare(page, square)
    }
    await place('white king', ['e1'])
    await place('white rook', ['h1', 'a1'])
    await place('black king', ['e8'])
    await place('black pawn', ['a7'])
    await place('white pawn', ['e4'])

    await page.getByRole('checkbox', { name: 'White king-side (O-O)' }).click()
    await page.getByRole('radio', { name: 'Black to move' }).click()

    const expected = '4k3/p7/8/8/4P3/8/8/R3K2R b K - 0 1'
    await expect(fenBox(page)).toHaveValue(expected)
    await expect(page.getByTestId('side-to-move')).toHaveText('Black to move')
    await expect(page.getByText('Ready for analysis')).toBeVisible()

    // Export back and in again: the same position, character for character.
    await page.getByRole('button', { name: 'Start position' }).click()
    await expect(fenBox(page)).toHaveValue(STARTING)
    await loadText(page, expected)
    await expect(fenBox(page)).toHaveValue(expected)
    await expect(board(page).locator('piece:not(.ghost)')).toHaveCount(6)
  })

  test('erases a piece with the eraser and restores it with undo', async ({ page }) => {
    await page.getByRole('button', { name: 'Erase pieces' }).click()
    await tapSquare(page, 'a2')
    await expect(fenBox(page)).toHaveValue(
      'rnbqkbnr/pppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1',
    )
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(fenBox(page)).toHaveValue(STARTING)
    await page.getByRole('button', { name: 'Redo' }).click()
    await expect(fenBox(page)).toHaveValue(
      'rnbqkbnr/pppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR w KQkq - 0 1',
    )
  })

  test('explains why a position cannot be analyzed and blocks playing', async ({ page }) => {
    await page.getByRole('button', { name: 'Clear board' }).click()
    const alert = page.getByRole('alert').filter({ hasText: 'cannot be analyzed' })
    await expect(alert).toContainText('White needs a king.')
    await expect(alert).toContainText('Black needs a king.')
    await expect(page.getByText('Ready for analysis')).toHaveCount(0)
    await expect(
      page
        .getByRole('radio', { name: 'Play moves' })
        .or(page.getByRole('button', { name: 'Play moves' })),
    ).toBeDisabled()

    await loadText(page, '4k3/8/8/8/8/8/8/4K3 w - - 0 1')
    await expect(page.getByText('Ready for analysis')).toBeVisible()
  })

  test('reports a FEN that cannot be read and keeps the board', async ({ page }) => {
    await loadText(page, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1')
    await expect(page.getByRole('alert').filter({ hasText: 'could not be loaded' })).toContainText(
      'The side to move must be “w” or “b”.',
    )
    await page.getByRole('button', { name: 'Start position' }).click()
    await expect(fenBox(page)).toHaveValue(STARTING)
  })

  test('loads a PGN, lists its moves and shows the position at a chosen move', async ({ page }) => {
    await loadText(page, '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *')
    const moves = page.getByRole('list', { name: 'Move list' })
    await expect(moves.getByRole('listitem')).toHaveCount(3)
    await expect(fenBox(page)).toHaveValue(
      'r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    )

    await moves.getByRole('button', { name: 'e5' }).click()
    await expect(fenBox(page)).toHaveValue(
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    )
    await expect(board(page).locator('piece:not(.ghost)')).toHaveCount(32)
  })

  test('plays legal moves in play mode, which fill the move list and export as PGN', async ({
    page,
  }) => {
    // Browsers differ on clipboard permissions, so record what the app writes instead.
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (text: string) => {
            ;(window as unknown as { copied: string }).copied = text
            return Promise.resolve()
          },
        },
      })
    })

    await page.getByRole('radio', { name: 'Play moves' }).click()
    await tapSquare(page, 'e2')
    await tapSquare(page, 'e4')
    await expect(fenBox(page)).toHaveValue(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    )
    await tapSquare(page, 'e7')
    await tapSquare(page, 'e5')

    await expect(page.getByRole('list', { name: 'Move list' }).getByRole('listitem')).toHaveCount(1)
    await page.getByRole('button', { name: 'Copy PGN' }).click()
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { copied?: string }).copied))
      .toContain('1. e4 e5')

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(fenBox(page)).toHaveValue(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    )
  })

  test('drags a spare piece onto the board and a piece off it', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'touch dragging is covered in palette.spec.ts')
    await page.getByRole('button', { name: 'Clear board' }).click()
    const box = (await board(page).boundingBox())!
    const center = (square: string) => ({
      x: box.x + (('abcdefgh'.indexOf(square[0] ?? '') + 0.5) * box.width) / 8,
      y: box.y + ((7 - (Number(square[1]) - 1) + 0.5) * box.height) / 8,
    })

    const queen = await page.getByRole('button', { name: 'white queen' }).boundingBox()
    await page.mouse.move(queen!.x + queen!.width / 2, queen!.y + queen!.height / 2)
    await page.mouse.down()
    await page.mouse.move(center('d4').x, center('d4').y, { steps: 8 })
    await page.mouse.up()
    await expect(fenBox(page)).toHaveValue('8/8/8/8/3Q4/8/8/8 w - - 0 1')
    // Dragging places a copy; it does not pick the piece for clicks.
    await expect(page.getByRole('button', { name: 'white queen' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    // Drop a piece outside the board to remove it.
    await page.getByRole('button', { name: 'Move pieces' }).click()
    await page.mouse.move(center('d4').x, center('d4').y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width + 40, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()
    await expect(fenBox(page)).toHaveValue('8/8/8/8/8/8/8/8 w - - 0 1')
  })

  test('flips the board', async ({ page }) => {
    await page.getByRole('button', { name: 'Flip board' }).click()
    await expect(
      board(page).locator('.orientation-black, [class*="orientation-black"]'),
    ).toHaveCount(1)
  })
})
