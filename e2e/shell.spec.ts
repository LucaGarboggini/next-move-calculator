import { expect, test, type Page } from '@playwright/test'

/** Theme and language live in the settings dialog. */
const openSettings = async (page: Page) => {
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible()
}

const box = async (page: Page, selector: string) => {
  const b = await page.locator(selector).boundingBox()
  if (!b) throw new Error(`${selector} has no box`)
  return b
}

test.describe('layout', () => {
  test('stacks board first on narrow portrait, side by side otherwise; board fits the viewport', async ({
    page,
  }) => {
    await page.goto('/')
    const { width, height } = page.viewportSize()!
    const board = await box(page, '[data-slot=board-frame]')
    const panel = await box(page, '[data-slot=panel-area]')
    const sideBySide = width >= 1024 || width > height

    if (sideBySide) {
      expect(panel.x).toBeGreaterThanOrEqual(board.x + board.width)
      expect(board.y + board.height).toBeLessThanOrEqual(height)
    } else {
      expect(panel.y).toBeGreaterThanOrEqual(board.y + board.height)
    }
    expect(board.x).toBeGreaterThanOrEqual(0)
    expect(board.x + board.width).toBeLessThanOrEqual(width)
    expect(Math.abs(board.width - board.height)).toBeLessThan(1)
  })

  test('touch devices get >= 44px targets in the header', async ({ page }) => {
    await page.goto('/')
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    test.skip(!coarse, 'fine pointers use compact controls')
    const controls = page.locator('header').getByRole('button')
    expect(await controls.count()).toBeGreaterThan(0)
    for (const control of await controls.all()) {
      const b = (await control.boundingBox())!
      expect(b.width).toBeGreaterThanOrEqual(44)
      expect(b.height).toBeGreaterThanOrEqual(44)
    }
  })
})

test.describe('theme', () => {
  test.describe('dark OS', () => {
    test('follows the system by default, can be overridden, and persists', async ({ page }) => {
      await page.goto('/')
      // Emulated after load: Firefox ignores the context-level colorScheme option.
      await page.emulateMedia({ colorScheme: 'dark' })
      await expect(page.locator('html')).toHaveClass(/dark/)

      await openSettings(page)
      await page.getByRole('radio', { name: 'Light theme' }).click()
      await expect(page.locator('html')).not.toHaveClass(/dark/)

      await page.reload()
      await expect(page.locator('html')).not.toHaveClass(/dark/)
      await openSettings(page)
      await expect(page.getByRole('radio', { name: 'Light theme' })).toBeChecked()

      await page.getByRole('radio', { name: 'System theme' }).click()
      await expect(page.locator('html')).toHaveClass(/dark/)
    })
  })

  test('follows live OS changes while on system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})

test.describe('i18n', () => {
  test('switches to pt-BR and persists', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Next-Move Calculator')

    await openSettings(page)
    await page.getByRole('combobox', { name: 'Language' }).click()
    await page.getByRole('option', { name: 'Português (Brasil)' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    await expect(page.getByRole('dialog', { name: 'Configurações' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Calculadora do Próximo Lance')

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Calculadora do Próximo Lance')
  })
})
