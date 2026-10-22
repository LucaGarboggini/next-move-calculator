import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

/**
 * WCAG 2.x A and AA violations on the page as it stands, as `rule: selectors` lines.
 * Waits for running transitions first: axe would read colours half-way between two states.
 */
export async function wcagViolations(page: Page): Promise<string[]> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  )
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
}
