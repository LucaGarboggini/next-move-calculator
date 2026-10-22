import { expect, test, type Page } from '@playwright/test'
import { wcagViolations } from './axe.ts'

// Mate in one: the engine finds Ra8# at once, so the flow does not depend on search speed.
const MATE_IN_ONE = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })
const fenBox = (page: Page) => page.getByRole('textbox', { name: 'FEN or PGN' })
const calculate = (page: Page) => page.getByRole('button', { name: 'Calculate' })

test.describe('the main flow, as in production', () => {
  test('set up a position, calculate, play the best move, save the board and load it again', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(board(page)).toBeVisible()
    await expect(page.getByTestId('analysis-side-to-move')).toHaveText('White to move')

    // 1. Set up a position.
    await fenBox(page).fill(MATE_IN_ONE)
    await page.getByRole('button', { name: 'Load' }).click()
    await expect(fenBox(page)).toHaveValue(MATE_IN_ONE)

    // 2. Calculate: best move, evaluation from White's point of view, line.
    await page.getByRole('spinbutton', { name: 'Depth limit' }).fill('12')
    await calculate(page).click()
    await expect(page.getByTestId('best-move')).toHaveText('Ra8#', { timeout: 60_000 })
    await expect(page.getByTestId('analysis-eval')).toHaveText('#1')
    await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })
    expect(await wcagViolations(page)).toEqual([])

    // 3. Play it, then take it back.
    await page.getByTestId('best-move').click()
    await expect(fenBox(page)).toHaveValue('R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1')
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(fenBox(page)).toHaveValue(MATE_IN_ONE)

    // 4. Save the board, reload the page, and bring the board back.
    const save = page.getByRole('textbox', { name: 'Name', exact: true })
    await save.fill('Back-rank mate')
    await page.getByRole('button', { name: 'Save this board' }).click()
    await expect(page.getByRole('list', { name: 'Your saved boards' })).toContainText(
      'Back-rank mate',
    )

    await page.reload()
    await expect(board(page)).toBeVisible()
    await page.getByRole('button', { name: 'Load “Back-rank mate”' }).click()
    await expect(fenBox(page)).toHaveValue(MATE_IN_ONE)
  })

  test('the app works offline from its own origin once loaded (no backend, no third parties)', async ({
    page,
  }) => {
    const foreign: string[] = []
    await page.goto('/')
    const own = new URL(page.url()).host
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.host !== own && url.protocol.startsWith('http')) foreign.push(request.url())
    })
    await page.reload()
    await fenBox(page).fill(MATE_IN_ONE)
    await page.getByRole('button', { name: 'Load' }).click()
    await page.getByRole('spinbutton', { name: 'Depth limit' }).fill('8')
    await calculate(page).click()
    await expect(page.getByTestId('best-move')).toHaveText('Ra8#', { timeout: 60_000 })
    expect(foreign).toEqual([])
  })

  test('the engine is not downloaded before the first calculation', async ({ page }) => {
    const engineRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/engine/')) engineRequests.push(request.url())
    })
    await page.goto('/')
    await expect(board(page)).toBeVisible()
    await page.waitForLoadState('networkidle')
    expect(engineRequests).toEqual([])

    await page.getByRole('spinbutton', { name: 'Depth limit' }).fill('6')
    await calculate(page).click()
    await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })
    expect(engineRequests.some((url) => url.includes('stockfish-19-lite'))).toBe(true)
  })
})

test.describe('keyboard only', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    test.skip(coarse, 'touch devices have no keyboard')
  })

  test('every control can be reached with Tab and shows where the focus is', async ({
    page,
    browserName,
  }) => {
    // Safari's Tab skips buttons unless a system setting is on; that is not the page's choice.
    test.skip(browserName === 'webkit', 'Tab only reaches form fields in Safari by default')
    await page.goto('/')
    await expect(board(page)).toBeVisible()

    const seen = new Set<string>()
    const hidden: string[] = []
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press('Tab')
      const focus = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body) return null
        const style = getComputedStyle(el)
        const outlined = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
        const ringed = style.boxShadow !== 'none'
        const label =
          el.getAttribute('aria-label') ??
          el.getAttribute('title') ??
          (el.textContent ?? '').trim().slice(0, 40) ??
          el.tagName
        const index = [...document.querySelectorAll('*')].indexOf(el)
        return { id: `${index}:${el.tagName}:${label}`, visible: outlined || ringed }
      })
      if (!focus) continue
      if (seen.has(focus.id)) break // the ring is complete: no trap, back where we began
      seen.add(focus.id)
      // The board shows its own cursor instead of an outline.
      if (!focus.visible && !focus.id.includes('Chessboard')) hidden.push(focus.id)
    }

    expect(hidden).toEqual([])
    expect(seen.size).toBeGreaterThan(15)
    const reached = [...seen].join('\n')
    for (const control of ['Settings', 'View shortcuts', 'Calculate', 'Flip board', 'Copy FEN']) {
      expect(reached).toContain(control)
    }
  })

  test('load, calculate and play with the keyboard; dialogs trap focus and give it back', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(board(page)).toBeVisible()

    // Load a position: type, Ctrl+Enter.
    await fenBox(page).focus()
    await fenBox(page).fill(MATE_IN_ONE)
    await page.keyboard.press('Control+Enter')
    await expect(fenBox(page)).toHaveValue(MATE_IN_ONE)

    // Calculate with the shortcut, from outside any field.
    await page.getByRole('spinbutton', { name: 'Depth limit' }).fill('12')
    await page.locator('body').click({ position: { x: 1, y: 1 } })
    await page.keyboard.press('Control+Enter')
    await expect(page.getByTestId('best-move')).toHaveText('Ra8#', { timeout: 60_000 })
    await expect(page.getByText('Done.')).toBeVisible({ timeout: 60_000 })

    // Play the best move from the keyboard.
    await page.getByTestId('best-move').focus()
    await page.keyboard.press('Enter')
    await expect(fenBox(page)).toHaveValue('R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1')

    // Undo and flip by shortcut.
    await page.locator('body').click({ position: { x: 1, y: 1 } })
    await page.keyboard.press('Control+z')
    await expect(fenBox(page)).toHaveValue(MATE_IN_ONE)
    await page.keyboard.press('f')
    await expect(page.locator('div.cg-wrap.orientation-black')).toBeVisible()

    // A dialog opens from the keyboard, keeps the focus inside, and returns it on Escape.
    const settings = page.getByRole('button', { name: 'Settings' })
    await settings.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Settings' })
    await expect(dialog).toBeVisible()
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(settings).toBeFocused()
  })
})
