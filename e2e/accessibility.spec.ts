import { expect, test, type Page } from '@playwright/test'
import { wcagViolations as violations } from './axe.ts'

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe, ${scheme} theme`, () => {
    test.use({ colorScheme: scheme })

    test('main screen has no violations', async ({ page }) => {
      await page.goto('/')
      await expect(board(page)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Calculate' })).toBeVisible()
      expect(await violations(page)).toEqual([])
    })

    test('settings and shortcut dialogs have no violations', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: 'Settings' }).click()
      await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
      expect(await violations(page)).toEqual([])
      await page.keyboard.press('Escape')

      await page.getByRole('button', { name: 'View shortcuts' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      expect(await violations(page)).toEqual([])
    })
  })
}

test.describe('Brazilian Portuguese', () => {
  test.use({ locale: 'pt-BR' })

  test('an invalid position in the translated UI has no violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    await page.getByRole('textbox').first().fill('8/8/8/8/8/8/8/8 w - - 0 1')
    await page.getByRole('button', { name: 'Carregar' }).click()
    expect(await violations(page)).toEqual([])
  })
})
