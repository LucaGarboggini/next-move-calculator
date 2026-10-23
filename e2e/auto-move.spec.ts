import { expect, test, type Locator, type Page } from '@playwright/test'

// Mate in one: the engine finds Ra8# at once, so the tests do not depend on search speed.
const MATE_IN_ONE = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'
const AFTER_MATE = 'R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1'
const STARTING = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/**
 * Positions where the real engine's best move is castling or a promotion by a wide margin at any
 * depth (see src/engine/stockfish/castling.test.ts and promotion.test.ts).
 */
const SPECIAL_MOVES = [
  {
    name: 'White O-O-O',
    fen: '8/5k2/8/4p3/4b3/1p6/8/R3K3 w Q - 0 1',
    after: '8/5k2/8/4p3/4b3/1p6/8/2KR4 b - - 1 1',
  },
  {
    name: 'White O-O',
    fen: '3n1k2/8/8/8/2NP4/r2p4/p7/4K2R w K - 0 1',
    after: '3n1k2/8/8/8/2NP4/r2p4/p7/5RK1 b - - 1 1',
  },
  {
    name: 'Black O-O-O',
    fen: 'r3k3/1R6/8/5p2/8/2PK4/8/8 b q - 0 1',
    after: '2kr4/1R6/8/5p2/8/2PK4/8/8 w - - 1 2',
  },
  {
    name: 'Black O-O',
    fen: '4k2r/2P5/B7/5K2/3b4/8/1Q6/8 b k - 0 1',
    after: '5rk1/2P5/B7/5K2/3b4/8/1Q6/8 w - - 1 2',
  },
  {
    name: 'White promotion to a queen',
    fen: '8/2P5/r7/8/8/7k/8/4K3 w - - 0 1',
    after: '2Q5/8/r7/8/8/7k/8/4K3 b - - 0 1',
  },
  {
    name: 'Black promotion to a queen',
    fen: '4k3/8/7K/8/8/R7/2p5/8 b - - 0 1',
    after: '4k3/8/7K/8/8/R7/8/2q5 w - - 0 2',
  },
  {
    name: 'White underpromotion to a knight',
    fen: '8/4P1k1/3q4/8/8/8/7P/K7 w - - 0 1',
    after: '4N3/6k1/3q4/8/8/8/7P/K7 b - - 0 1',
  },
] as const

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })
const fenBox = (page: Page) => page.getByRole('textbox', { name: 'FEN or PGN' })
const calculate = (page: Page) => page.getByRole('button', { name: 'Calculate' })
const stop = (page: Page) => page.getByRole('button', { name: 'Stop' })
const autoMove = (page: Page) =>
  page.getByRole('switch', { name: 'Play the best move automatically' })
const lines = (page: Page) => page.getByTestId('analysis-line')
const arrows = (page: Page) => board(page).locator('.cg-shapes line')

/** A tap on touch devices (a click there is a mouse event), a click elsewhere. */
async function press(locator: Locator, hasTouch: boolean) {
  if (hasTouch) await locator.tap()
  else await locator.click()
}

async function loadText(page: Page, text: string) {
  await fenBox(page).fill(text)
  await page.getByRole('button', { name: 'Load' }).click()
  await expect(fenBox(page)).toHaveValue(text)
}

async function turnOnAutoMove(page: Page, hasTouch: boolean) {
  await press(autoMove(page), hasTouch)
  await expect(autoMove(page)).toBeChecked()
}

/** Limits the search to a depth, so it ends by itself and quickly. */
async function limitDepth(page: Page, depth: number) {
  await page.getByRole('spinbutton', { name: 'Depth limit' }).fill(String(depth))
}

/** Sets the time per search with the keyboard: Home is 1 s, End is 60 s. */
async function setTime(page: Page, key: 'Home' | 'End') {
  await page.getByRole('slider', { name: 'Time per search' }).focus()
  await page.keyboard.press(key)
}

/** After an auto-move: no line, arrow or best move of the old position, and no new search. */
async function expectNothingAnalysed(page: Page) {
  await expect(calculate(page)).toBeVisible()
  await expect(stop(page)).toHaveCount(0)
  await expect(lines(page)).toHaveCount(0)
  await expect(page.getByTestId('best-move')).toHaveCount(0)
  await expect(arrows(page)).toHaveCount(0)
}

test.describe('auto-move', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(board(page)).toBeVisible()
  })

  test('is off by default: a finished search leaves the board as it was', async ({ page }) => {
    await expect(autoMove(page)).not.toBeChecked()
    await loadText(page, MATE_IN_ONE)
    await limitDepth(page, 12)
    await calculate(page).click()

    await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByTestId('best-move')).toHaveText('Ra8#')
    await expect(fenBox(page)).toHaveValue(MATE_IN_ONE)
  })

  test('on: plays the best move when the depth limit is reached, and it can be undone', async ({
    page,
    hasTouch,
  }) => {
    await turnOnAutoMove(page, hasTouch)
    await loadText(page, MATE_IN_ONE)
    await limitDepth(page, 12)
    await calculate(page).click()

    await expect(fenBox(page)).toHaveValue(AFTER_MATE, { timeout: 60_000 })
    await expect(
      page.getByRole('list', { name: 'Move list' }).getByRole('button', { name: 'Ra8#' }),
    ).toBeVisible()
    await expectNothingAnalysed(page)
    await expect(page.getByText('Checkmate: there is no move to calculate.')).toBeVisible()

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(fenBox(page)).toHaveValue(MATE_IN_ONE)
    await expectNothingAnalysed(page)
    await expect(page.getByText('Press Calculate to find the best move.')).toBeVisible()
  })

  test('on: plays when the time limit is reached, and does not start another search', async ({
    page,
    hasTouch,
  }) => {
    await turnOnAutoMove(page, hasTouch)
    await setTime(page, 'Home')
    await calculate(page).click()

    await expect(fenBox(page)).not.toHaveValue(STARTING, { timeout: 60_000 })
    // One move from the start: Black to move, move 1.
    await expect(fenBox(page)).toHaveValue(/ b KQkq \S+ \d+ 1$/)
    const played = await fenBox(page).inputValue()
    await expectNothingAnalysed(page)
    await expect(page.getByText('Press Calculate to find the best move.')).toBeVisible()

    // Longer than a 1 s search: a new one would have shown lines or moved again by now.
    await page.waitForTimeout(2500)
    await expectNothingAnalysed(page)
    await expect(fenBox(page)).toHaveValue(played)
  })

  test('on: Stop never plays a move', async ({ page, hasTouch }) => {
    await turnOnAutoMove(page, hasTouch)
    await setTime(page, 'End')
    await calculate(page).click()
    await expect(page.getByTestId('best-move')).toBeVisible({ timeout: 60_000 })

    await press(stop(page), hasTouch)

    await expect(page.getByText('Stopped.')).toBeVisible()
    await expect(page.getByTestId('best-move')).toBeVisible()
    await page.waitForTimeout(1000)
    await expect(fenBox(page)).toHaveValue(STARTING)
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })

  test('explains that it needs a time or depth limit when searching until stopped', async ({
    page,
    hasTouch,
  }) => {
    const needsLimit = page.getByText('Needs a time or depth limit', { exact: false })
    await turnOnAutoMove(page, hasTouch)
    await expect(needsLimit).toHaveCount(0)

    await press(page.getByRole('switch', { name: 'Until stopped' }), hasTouch)
    await expect(needsLimit).toBeVisible()
    await expect(autoMove(page)).toHaveAccessibleDescription(/Needs a time or depth limit/)

    await limitDepth(page, 10)
    await expect(needsLimit).toHaveCount(0)
  })

  test('is remembered after a reload', async ({ page, hasTouch }) => {
    await turnOnAutoMove(page, hasTouch)
    await page.reload()
    await expect(autoMove(page)).toBeChecked()
  })

  for (const { name, fen, after } of SPECIAL_MOVES) {
    test(`plays the engine’s ${name}`, async ({ page, hasTouch }) => {
      await turnOnAutoMove(page, hasTouch)
      await loadText(page, fen)
      await limitDepth(page, 12)
      await calculate(page).click()

      await expect(fenBox(page)).toHaveValue(after, { timeout: 60_000 })
      await expectNothingAnalysed(page)
    })
  }
})
