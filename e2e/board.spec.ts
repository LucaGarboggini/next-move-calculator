import { expect, test, type Page } from '@playwright/test'

const board = (page: Page) => page.getByRole('application', { name: 'Chessboard' })

test.describe('board', () => {
  test('draws the starting position with token-colored squares and sprite pieces', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(board(page)).toBeVisible()
    await expect(board(page).locator('piece:not(.ghost)')).toHaveCount(32)

    const styles = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement)
      const cgBoard = getComputedStyle(document.querySelector('cg-board')!)
      const king = getComputedStyle(document.querySelector('piece.king.white')!)
      return {
        lightToken: root.getPropertyValue('--board-square-light').trim(),
        background: cgBoard.backgroundImage,
        touchAction: cgBoard.touchAction,
        sprite: king.backgroundImage,
      }
    })
    expect(styles.lightToken).not.toBe('')
    expect(styles.background).toContain('conic-gradient')
    expect(styles.touchAction).toBe('none')
    expect(styles.sprite).toContain('url(')
  })

  test('is square, fits the viewport, and has coordinates inside the board', async ({ page }) => {
    await page.goto('/')
    const box = (await board(page).boundingBox())!
    const { width, height } = page.viewportSize()!
    expect(Math.abs(box.width - box.height)).toBeLessThan(1)
    expect(box.x + box.width).toBeLessThanOrEqual(width)
    expect(box.y).toBeGreaterThanOrEqual(0)
    const outside = await page.evaluate(() => {
      const b = document.querySelector('[data-slot=board]')!.getBoundingClientRect()
      return [...document.querySelectorAll('coords')].some((c) => {
        const r = c.getBoundingClientRect()
        return (
          r.left < b.left - 1 ||
          r.right > b.right + 1 ||
          r.top < b.top - 1 ||
          r.bottom > b.bottom + 1
        )
      })
    })
    expect(outside).toBe(false)
    expect(height).toBeGreaterThan(0)
  })

  test('the keyboard cursor moves and is announced', async ({ page }) => {
    await page.goto('/')
    await board(page).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('status').filter({ hasText: 'f2, white pawn' })).toBeAttached()
    await expect(page.locator('[data-slot=board-cursor]')).toBeVisible()
  })

  test('is translated', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('combobox', { name: 'Language' }).click()
    await page.getByRole('option', { name: 'Português (Brasil)' }).click()
    await expect(page.getByRole('application', { name: 'Tabuleiro de xadrez' })).toBeVisible()
  })
})
