import { expect, test, type Page } from '@playwright/test'

// Mate in one: the engine finds Ra8# at once, so the tests do not depend on search speed.
const MATE_IN_ONE = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'
const STARTING = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })
const fenBox = (page: Page) => page.getByRole('textbox', { name: 'FEN or PGN' })
const calculate = (page: Page) => page.getByRole('button', { name: 'Calculate' })
const stop = (page: Page) => page.getByRole('button', { name: 'Stop' })

/** Loads text through the FEN box the way a user would: type, then press Load. */
async function loadText(page: Page, text: string) {
  await fenBox(page).fill(text)
  await page.getByRole('button', { name: 'Load' }).click()
}

/** Limits the search to a depth, so it ends by itself and quickly. */
async function limitDepth(page: Page, depth: number) {
  await page.getByRole('spinbutton', { name: 'Depth limit' }).fill(String(depth))
}

/** Searches until stopped, so a test can look at a search in progress. */
async function searchUntilStopped(page: Page) {
  await page.getByRole('switch', { name: 'Until stopped' }).click()
}

test.describe('analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(board(page)).toBeVisible()
  })

  test('set a position, calculate, and see the best move, evaluation and arrow', async ({
    page,
  }) => {
    await loadText(page, MATE_IN_ONE)
    await limitDepth(page, 12)
    await expect(page.getByTestId('best-move')).toHaveCount(0)

    await calculate(page).click()

    await expect(page.getByTestId('best-move')).toHaveText('Ra8#', { timeout: 60_000 })
    await expect(page.getByTestId('analysis-eval')).toHaveText('#1')
    await expect(page.getByTestId('analysis-side-to-move')).toHaveText('White to move')
    await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })
    await expect(calculate(page)).toBeEnabled()
    await expect(page.getByTestId('analysis-line').first()).toContainText('Ra8#')
    await expect(page.getByTestId('analysis-stats')).toContainText('Depth')

    // The best move is drawn on the board (the visual layer, not the accessible one).
    await expect(board(page).locator('.cg-shapes line').first()).toBeAttached()
  })

  test('shows several lines, the best one first, with fainter arrows for the others', async ({
    page,
  }) => {
    await limitDepth(page, 10)
    await page.getByRole('radio', { name: '3 lines' }).click()
    await calculate(page).click()

    await expect(page.getByTestId('analysis-line')).toHaveCount(3, { timeout: 60_000 })
    await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })
    await expect(board(page).locator('.cg-shapes line')).toHaveCount(3)
  })

  test('clicking the best move plays it and the old analysis disappears', async ({ page }) => {
    await loadText(page, MATE_IN_ONE)
    await limitDepth(page, 12)
    await calculate(page).click()
    await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })

    await page.getByTestId('best-move').click()

    await expect(fenBox(page)).toHaveValue('R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1')
    await expect(page.getByTestId('best-move')).toHaveCount(0)
    await expect(page.getByTestId('analysis-line')).toHaveCount(0)
    // Recalculating is manual: nothing started by itself (and this position is checkmate).
    await expect(page.getByText('Checkmate: there is no move to calculate.')).toBeVisible()
    await expect(calculate(page)).toBeDisabled()
  })

  test('clicking a move in a line plays the line up to that move', async ({ page }) => {
    await limitDepth(page, 14)
    await page.getByRole('radio', { name: '1 lines' }).click()
    await calculate(page).click()
    await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })

    // The third move of the best line: three plies are played, as one step.
    const third = page.getByTestId('analysis-line').first().getByRole('button').nth(2)
    await third.click()

    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled()
    await expect(page.getByTestId('analysis-line')).toHaveCount(0)
    await expect(fenBox(page)).not.toHaveValue(STARTING)
    // Three plies from the start: Black to move, move 2.
    await expect(fenBox(page)).toHaveValue(/ b \S+ \S+ \d+ 2$/)
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(fenBox(page)).toHaveValue(STARTING)
  })

  test('stop keeps the best result so far, and calculating again works', async ({ page }) => {
    await searchUntilStopped(page)
    await calculate(page).click()

    await expect(stop(page)).toBeVisible()
    await expect(page.getByTestId('best-move')).toBeVisible({ timeout: 60_000 })
    await stop(page).click()

    await expect(page.getByText('Stopped.')).toBeVisible()
    await expect(page.getByTestId('best-move')).toBeVisible()
    await expect(calculate(page)).toBeEnabled()

    await calculate(page).click()
    await expect(stop(page)).toBeVisible()
    await expect(page.getByTestId('best-move')).toBeVisible({ timeout: 60_000 })
    await stop(page).click()
    await expect(page.getByText('Stopped.')).toBeVisible()
  })

  test('changing the position ends the search and never shows its result', async ({ page }) => {
    await searchUntilStopped(page)
    await calculate(page).click()
    await expect(page.getByTestId('best-move')).toBeVisible({ timeout: 60_000 })

    await page.getByRole('radio', { name: 'Black to move' }).click()

    await expect(calculate(page)).toBeVisible()
    await expect(page.getByTestId('best-move')).toHaveCount(0)
    await expect(board(page).locator('.cg-shapes line')).toHaveCount(0)
  })

  test('the page keeps responding while a five-line search streams output', async ({ page }) => {
    await searchUntilStopped(page)
    await page.getByRole('radio', { name: '5 lines' }).click()

    await calculate(page).click()
    await expect(page.getByTestId('analysis-line')).toHaveCount(5, { timeout: 60_000 })

    // Once the engine is running and streaming (its start-up is not what is tested), measure the longest
    // gap between two animation frames: a blocked main thread shows up as a long gap.
    await page.evaluate(() => {
      const probe = { maxGap: 0, last: performance.now(), running: true }
      const tick = (time: number) => {
        probe.maxGap = Math.max(probe.maxGap, time - probe.last)
        probe.last = time
        if (probe.running) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      ;(window as unknown as { __frameProbe: typeof probe }).__frameProbe = probe
    })

    await page.waitForTimeout(3000)
    await stop(page).click()

    const maxGap = await page.evaluate(() => {
      const probe = (window as unknown as { __frameProbe: { maxGap: number; running: boolean } })
        .__frameProbe
      probe.running = false
      return probe.maxGap
    })
    // Streaming output must not stall the page: no frame may take long.
    expect(maxGap).toBeLessThan(1000)
  })
})
