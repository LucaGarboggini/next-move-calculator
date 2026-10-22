import { expect, test } from '@playwright/test'

test('shell renders board and panel areas without horizontal scroll', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('complementary')).toBeAttached()

  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflowX).toBe(false)
})

test('is cross-origin isolated (COOP/COEP) for multi-threaded engine mode', async ({
  page,
  browserName,
}) => {
  const response = await page.goto('/')
  expect(response?.headers()['cross-origin-opener-policy']).toBe('same-origin')
  expect(response?.headers()['cross-origin-embedder-policy']).toBe('require-corp')
  // WebKit only exposes SharedArrayBuffer isolation over a secure context; headers suffice there.
  if (browserName !== 'webkit') {
    expect(await page.evaluate(() => window.crossOriginIsolated)).toBe(true)
  }
})
