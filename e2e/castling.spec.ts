import { expect, test, type Page } from '@playwright/test'

// Both castling sides for both colors, through every way a move reaches the board.
const WHITE_TO_MOVE = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1'
const BLACK_TO_MOVE = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQkq - 0 1'

interface Castle {
  readonly name: string
  readonly san: string
  readonly start: string
  readonly from: string
  readonly to: string
  /** Edit mode moves pieces without taking a turn. */
  readonly edited: string
  readonly played: string
}

const CASTLES: readonly Castle[] = [
  {
    name: 'White O-O-O',
    san: 'O-O-O',
    start: WHITE_TO_MOVE,
    from: 'e1',
    to: 'c1',
    edited: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/2KR3R w kq - 0 1',
    played: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/2KR3R b kq - 1 1',
  },
  {
    name: 'White O-O',
    san: 'O-O',
    start: WHITE_TO_MOVE,
    from: 'e1',
    to: 'g1',
    edited: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R4RK1 w kq - 0 1',
    played: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R4RK1 b kq - 1 1',
  },
  {
    name: 'Black O-O-O',
    san: 'O-O-O',
    start: BLACK_TO_MOVE,
    from: 'e8',
    to: 'c8',
    edited: '2kr3r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQ - 0 1',
    played: '2kr3r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQ - 1 2',
  },
  {
    name: 'Black O-O',
    san: 'O-O',
    start: BLACK_TO_MOVE,
    from: 'e8',
    to: 'g8',
    edited: 'r4rk1/pppppppp/8/8/8/8/PPPPPPPP/R3K2R b KQ - 0 1',
    played: 'r4rk1/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQ - 1 2',
  },
]

/** Positions where the real engine's best move is castling, by a wide margin and at any depth. */
const ENGINE_CASTLES = [
  {
    name: 'White O-O-O',
    san: /^O-O-O/,
    fen: '8/5k2/8/4p3/4b3/1p6/8/R3K3 w Q - 0 1',
    after: '8/5k2/8/4p3/4b3/1p6/8/2KR4 b - - 1 1',
  },
  {
    name: 'White O-O',
    san: /^O-O(?!-O)/,
    fen: '3n1k2/8/8/8/2NP4/r2p4/p7/4K2R w K - 0 1',
    after: '3n1k2/8/8/8/2NP4/r2p4/p7/5RK1 b - - 1 1',
  },
  {
    name: 'Black O-O-O',
    san: /^O-O-O/,
    fen: 'r3k3/1R6/8/5p2/8/2PK4/8/8 b q - 0 1',
    after: '2kr4/1R6/8/5p2/8/2PK4/8/8 w - - 1 2',
  },
  {
    name: 'Black O-O',
    san: /^O-O(?!-O)/,
    fen: '4k2r/2P5/B7/5K2/3b4/8/1Q6/8 b k - 0 1',
    after: '5rk1/2P5/B7/5K2/3b4/8/1Q6/8 w - - 1 2',
  },
] as const

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })
const fenBox = (page: Page) => page.getByRole('textbox', { name: 'FEN or PGN' })
const moveList = (page: Page) => page.getByRole('list', { name: 'Move list' })

async function loadText(page: Page, text: string) {
  await fenBox(page).fill(text)
  await page.getByRole('button', { name: 'Load' }).click()
}

/** Position of a square inside the board (shown from White's side). */
async function squarePosition(page: Page, square: string) {
  const file = 'abcdefgh'.indexOf(square[0] ?? '')
  const rank = Number(square[1]) - 1
  // Pressing a control below the board can leave the page scrolled; measure the board in place.
  await board(page).evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
  const box = (await board(page).boundingBox())!
  return { x: ((file + 0.5) * box.width) / 8, y: ((7 - rank + 0.5) * box.height) / 8 }
}

/** Taps (touch devices) or clicks the origin square, then the target square. */
async function tapMove(page: Page, hasTouch: boolean, from: string, to: string) {
  for (const square of [from, to]) {
    const position = await squarePosition(page, square)
    if (hasTouch) await board(page).tap({ position })
    else await board(page).click({ position })
  }
}

async function dragMove(page: Page, from: string, to: string) {
  const box = (await board(page).boundingBox())!
  const [a, b] = [await squarePosition(page, from), await squarePosition(page, to)]
  await page.mouse.move(box.x + a.x, box.y + a.y)
  await page.mouse.down()
  await page.mouse.move(box.x + b.x, box.y + b.y, { steps: 8 })
  await page.mouse.up()
}

test.describe('castling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(board(page)).toBeVisible()
  })

  for (const castle of CASTLES) {
    test.describe(castle.name, () => {
      test('moving the king two files in the editor castles and uses up the rights', async ({
        page,
        hasTouch,
      }) => {
        await loadText(page, castle.start)
        await tapMove(page, hasTouch, castle.from, castle.to)
        await expect(fenBox(page)).toHaveValue(castle.edited)
        await expect(page.getByText('Ready for analysis')).toBeVisible()
      })

      test('dragging the king two files in the editor castles', async ({ page, hasTouch }) => {
        test.skip(hasTouch, 'dragging is covered with a mouse; touch uses taps')
        await loadText(page, castle.start)
        await dragMove(page, castle.from, castle.to)
        await expect(fenBox(page)).toHaveValue(castle.edited)
      })

      test('plays it in play mode by tap or click', async ({ page, hasTouch }) => {
        await loadText(page, castle.start)
        await page.getByRole('radio', { name: 'Play moves' }).click()
        await tapMove(page, hasTouch, castle.from, castle.to)
        await expect(fenBox(page)).toHaveValue(castle.played)
        await expect(moveList(page).getByRole('button', { name: castle.san })).toBeVisible()
      })

      test('plays it in play mode by drag', async ({ page, hasTouch }) => {
        test.skip(hasTouch, 'dragging is covered with a mouse; touch uses taps')
        await loadText(page, castle.start)
        await page.getByRole('radio', { name: 'Play moves' }).click()
        await dragMove(page, castle.from, castle.to)
        await expect(fenBox(page)).toHaveValue(castle.played)
      })
    })
  }

  test('imports castling from a PGN, both sides for both colors', async ({ page }) => {
    await loadText(page, '1. d4 d5 2. Nc3 Nc6 3. Bf4 Bf5 4. Qd2 Qd7 5. O-O-O O-O-O *')
    await expect(fenBox(page)).toHaveValue(
      '2kr1bnr/pppqpppp/2n5/3p1b2/3P1B2/2N5/PPPQPPPP/2KR1BNR w - - 8 6',
    )
    await expect(moveList(page).getByRole('button', { name: 'O-O-O' })).toHaveCount(2)

    await loadText(page, '1. e4 e5 2. Nf3 Nf6 3. Bc4 Bc5 4. 0-0 0-0 *')
    await expect(fenBox(page)).toHaveValue(
      'rnbq1rk1/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w - - 6 5',
    )
    await expect(moveList(page).getByRole('button', { name: 'O-O' })).toHaveCount(2)
  })

  test('a FEN’s castling rights decide which castling is possible', async ({ page, hasTouch }) => {
    await loadText(page, 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w Qk - 0 1')
    await page.getByRole('radio', { name: 'Play moves' }).click()
    // No K: the king cannot go to g1 (and the tap there drops the selection).
    await tapMove(page, hasTouch, 'e1', 'g1')
    await expect(fenBox(page)).toHaveValue('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w Qk - 0 1')
    await tapMove(page, hasTouch, 'e1', 'c1')
    await expect(fenBox(page)).toHaveValue('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/2KR3R b k - 1 1')
    await tapMove(page, hasTouch, 'e8', 'g8')
    await expect(fenBox(page)).toHaveValue('r4rk1/pppppppp/8/8/8/8/PPPPPPPP/2KR3R w - - 2 2')
  })

  for (const { name, san, fen, after } of ENGINE_CASTLES) {
    test(`plays the engine’s ${name}`, async ({ page }) => {
      await loadText(page, fen)
      await page.getByRole('spinbutton', { name: 'Depth limit' }).fill('12')
      await page.getByRole('button', { name: 'Calculate' }).click()
      await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })
      await expect(page.getByTestId('best-move')).toHaveText(san)

      await page.getByTestId('best-move').click()
      await expect(fenBox(page)).toHaveValue(after)
    })
  }
})
