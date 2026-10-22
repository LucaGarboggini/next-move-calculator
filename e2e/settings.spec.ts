import { expect, test, type Page } from '@playwright/test'

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

const openSettings = async (page: Page) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  return page.getByRole('dialog', { name: 'Settings' })
}

test.describe('settings', () => {
  test('are kept after a reload and applied to the board', async ({ page }) => {
    await page.goto('/')
    const board = page.getByRole('application', { name: 'Chessboard' })
    await expect(board).toHaveAttribute('data-board-theme', 'green')

    const dialog = await openSettings(page)
    await dialog.getByRole('combobox', { name: 'Board colors' }).click()
    await page.getByRole('option', { name: 'Blue' }).click()
    await dialog.getByRole('combobox', { name: 'Move notation' }).click()
    await page.getByRole('option', { name: 'Figurine (♘f3)' }).click()
    await dialog.getByRole('switch', { name: 'Always promote to a queen' }).click()
    await expect(board).toHaveAttribute('data-board-theme', 'blue')

    await page.reload()
    await expect(board).toHaveAttribute('data-board-theme', 'blue')
    const again = await openSettings(page)
    await expect(again.getByRole('combobox', { name: 'Move notation' })).toContainText('Figurine')
    await expect(again.getByRole('switch', { name: 'Always promote to a queen' })).toBeChecked()
  })

  test('the Full engine asks first, and Lite stays the default', async ({ page }) => {
    await page.goto('/')
    const dialog = await openSettings(page)
    await expect(dialog.getByRole('radio', { name: /Lite/ })).toBeChecked()

    await dialog.getByRole('radio', { name: /Full/ }).click()
    const confirm = page.getByRole('dialog', { name: 'Use the Full engine?' })
    await expect(confirm).toContainText('94 MB')
    await confirm.getByRole('button', { name: 'Keep Lite' }).click()
    await expect(dialog.getByRole('radio', { name: /Lite/ })).toBeChecked()
  })
})

test.describe('saved boards', () => {
  test('boards saved by an older version still load after the schema changed', async ({ page }) => {
    // What version 1 of the saved-boards store wrote: positions only, no moves or orientation.
    await page.addInitScript((fen) => {
      if (localStorage.getItem('nmc-saved-boards')) return
      localStorage.setItem(
        'nmc-saved-boards',
        JSON.stringify({
          version: 1,
          state: {
            boards: [{ id: 'old', name: 'Saved long ago', fen, savedAt: 1_700_000_000_000 }],
          },
        }),
      )
    }, AFTER_E4)
    await page.goto('/')

    const list = page.getByRole('list', { name: 'Your saved boards' })
    await expect(list).toContainText('Saved long ago')
    await page.getByRole('button', { name: 'Load “Saved long ago”' }).click()
    await expect(page.getByRole('textbox', { name: /FEN/ })).toHaveValue(AFTER_E4)

    // The store rewrote it in the current format and keeps working.
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Newer board')
    await page.getByRole('button', { name: 'Save this board' }).click()
    const stored = await page.evaluate(() => localStorage.getItem('nmc-saved-boards'))
    await page.reload()
    await expect(list).toContainText('Newer board')
    await expect(list).toContainText('Saved long ago')
    expect(JSON.parse(stored ?? '{}')).toMatchObject({ version: 2 })
  })

  test('saves a board and brings it back after a reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Start')
    await page.getByRole('button', { name: 'Save this board' }).click()
    await page.reload()
    await expect(page.getByRole('list', { name: 'Your saved boards' })).toContainText('Start')
  })
})

test.describe('keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    test.skip(coarse, 'touch devices have no keyboard')
  })

  test('flip the board, and open the list with ?', async ({ page }) => {
    await expect(page.locator('div.cg-wrap.orientation-white')).toBeVisible()
    await page.keyboard.press('f')
    await expect(page.locator('div.cg-wrap.orientation-black')).toBeVisible()

    await page.keyboard.press('?')
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
    await expect(dialog).toContainText('Flip the board')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('can be turned off', async ({ page }) => {
    const dialog = await openSettings(page)
    await dialog.getByRole('switch', { name: 'Keyboard shortcuts' }).click()
    await page.keyboard.press('Escape')
    await page.keyboard.press('f')
    await expect(page.locator('div.cg-wrap.orientation-white')).toBeVisible()
  })
})
