import { expect, test, type Locator, type Page } from '@playwright/test'
import { wcagViolations as violations } from './axe.ts'

// Mate in one either way, so the tests do not depend on search speed.
const WHITE_MATES = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'
const BLACK_MATES = 'r5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1'
const STALEMATE = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'
// The Italian after 3. Bc4: no forced mate, a centipawn eval.
const OPENING = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'

const evalBar = (page: Page) => page.getByRole('meter', { name: 'Who’s winning' })
const fill = (page: Page) => evalBar(page).locator('[data-slot=balance-bar-fill]')
const label = (page: Page) => evalBar(page).locator('[data-slot=balance-bar-label]')

async function loadText(page: Page, text: string) {
  await page.getByRole('textbox', { name: 'FEN or PGN' }).fill(text)
  await page.getByRole('button', { name: 'Load' }).click()
}

async function calculateToDepth(page: Page, depth: number) {
  await page.getByRole('spinbutton', { name: 'Depth limit' }).fill(String(depth))
  await page.getByRole('button', { name: 'Calculate' }).click()
  await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })
}

const box = async (locator: Locator) => {
  const b = await locator.boundingBox()
  if (!b) throw new Error('no box')
  return b
}

const sideBySide = (page: Page) => {
  const { width, height } = page.viewportSize()!
  return width >= 1024 || width > height
}

/**
 * Where White's part of the bar starts, and how much of the bar it covers (0..1). The part is as
 * large as the bar and slides, so its box shows both.
 */
async function whitePart(page: Page) {
  const [bar, part] = await Promise.all([box(evalBar(page)), box(fill(page))])
  if (sideBySide(page)) {
    const fromBottom = part.y + part.height > bar.y + bar.height - 1
    const covered = fromBottom ? bar.y + bar.height - part.y : part.y + part.height - bar.y
    return { from: fromBottom ? 'bottom' : 'top', share: covered / bar.height }
  }
  const fromLeft = part.x < bar.x + 1
  const covered = fromLeft ? part.x + part.width - bar.x : bar.x + bar.width - part.x
  return { from: fromLeft ? 'left' : 'right', share: covered / bar.width }
}

test.describe('eval bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(evalBar(page)).toBeVisible()
  })

  test('is beside the board side by side and above it when stacked, all inside the viewport', async ({
    page,
  }) => {
    const { width, height } = page.viewportSize()!
    const bar = await box(evalBar(page))
    const board = await box(page.locator('[data-slot=board-frame]'))

    if (sideBySide(page)) {
      expect(bar.x + bar.width).toBeLessThanOrEqual(board.x)
      expect(Math.abs(bar.y - board.y)).toBeLessThan(1)
      expect(Math.abs(bar.height - board.height)).toBeLessThan(1)
      expect(bar.width).toBeLessThan(bar.height)
      expect(board.y + board.height).toBeLessThanOrEqual(height)
    } else {
      expect(bar.y + bar.height).toBeLessThanOrEqual(board.y)
      expect(Math.abs(bar.x - board.x)).toBeLessThan(1)
      expect(Math.abs(bar.width - board.width)).toBeLessThan(1)
      expect(bar.height).toBeLessThan(bar.width)
    }
    expect(bar.x).toBeGreaterThanOrEqual(0)
    expect(board.x + board.width).toBeLessThanOrEqual(width)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
  })

  test('is level before any evaluation and flips with the board', async ({ page }) => {
    await expect(evalBar(page)).toHaveAttribute('aria-valuenow', '50')
    await expect(evalBar(page)).toHaveAttribute('aria-valuetext', 'No evaluation yet')
    const [start, end] = sideBySide(page) ? ['bottom', 'top'] : ['left', 'right']

    await expect.poll(() => whitePart(page)).toEqual({ from: start, share: expect.closeTo(0.5, 1) })
    await page.getByRole('button', { name: 'Flip board' }).click()
    await expect(evalBar(page)).toHaveAttribute('data-orientation', 'black')
    await expect.poll(() => whitePart(page)).toEqual({ from: end, share: expect.closeTo(0.5, 1) })
  })

  test("maps a centipawn eval through the win-chance curve, from White's side", async ({
    page,
  }) => {
    await loadText(page, OPENING)
    await calculateToDepth(page, 12)

    const text = (await page.getByTestId('analysis-eval').textContent())!
    const cp = Number(text) * 100
    const expected = 100 / (1 + Math.exp(-0.00368208 * cp))
    const advantage = (await page.getByTestId('analysis-eval').locator('xpath=..').textContent())!
      .replace(text, '')
      .trim()
    await expect(evalBar(page)).toHaveAttribute('aria-valuenow', String(Math.round(expected)))
    await expect(evalBar(page)).toHaveAttribute(
      'aria-valuetext',
      `Evaluation ${text}: ${advantage}`,
    )
    await expect(label(page)).toHaveText(/^([+-]\d+\.\d|0\.0)$/)
    await expect.poll(async () => (await whitePart(page)).share).toBeCloseTo(expected / 100, 1)
  })

  test('is full for a forced mate, for either side, and shows the result once it is mate', async ({
    page,
  }) => {
    await loadText(page, WHITE_MATES)
    await calculateToDepth(page, 12)
    await expect(evalBar(page)).toHaveAttribute('aria-valuenow', '100')
    await expect(label(page)).toHaveText('#1')
    await expect.poll(async () => (await whitePart(page)).share).toBeCloseTo(1, 1)

    await page.getByTestId('best-move').click()
    await expect(evalBar(page)).toHaveAttribute('aria-valuetext', 'Evaluation 1-0: White has won')
    await expect(label(page)).toHaveText('1-0')

    await loadText(page, BLACK_MATES)
    await expect(evalBar(page)).toHaveAttribute('aria-valuetext', 'No evaluation yet')
    await calculateToDepth(page, 12)
    await expect(evalBar(page)).toHaveAttribute('aria-valuenow', '0')
    await expect(label(page)).toHaveText('#-1')
    await expect.poll(async () => (await whitePart(page)).share).toBeCloseTo(0, 1)
  })

  test('is level for a drawn position', async ({ page }) => {
    await loadText(page, STALEMATE)
    await expect(evalBar(page)).toHaveAttribute('aria-valuenow', '50')
    await expect(evalBar(page)).toHaveAttribute('aria-valuetext', 'Evaluation 0.00: Equal')
    await expect(label(page)).toHaveText('0.0')
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`with an evaluation has no axe violations in the ${scheme} theme`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await loadText(page, WHITE_MATES)
      await calculateToDepth(page, 12)
      await expect(label(page)).toHaveText('#1')
      expect(await violations(page)).toEqual([])
    })
  }
})
