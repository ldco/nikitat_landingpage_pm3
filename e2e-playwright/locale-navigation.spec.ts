/**
 * Locale-Aware Navigation Tests — PM3
 *
 * Covers the PM v2 locale contract on the real routed app:
 *   1. Changing language from a mid-page onepager section keeps BOTH the
 *      target locale prefix AND the section hash (no page-top reset).
 *   2. Internal public links (header nav, hero CTA) carry the active locale
 *      prefix for non-default locales instead of raw root-relative hrefs.
 *
 * Run: npm run test:e2e
 */
import { test, expect } from '@playwright/test'

test.describe('Locale-aware navigation', () => {
  test('language switch from a section keeps the hash, scroll position and locale prefix', async ({ page }) => {
    await page.goto('/#focus')
    await page.waitForLoadState('networkidle')
    // Let the initial anchor scroll settle before recording the position.
    await page.waitForTimeout(400)

    const before = await page.evaluate(() => ({ y: window.scrollY, hash: location.hash }))
    expect(before.hash).toBe('#focus')
    // The section anchor scrolls the page down — the switch must not restart from the top.
    expect(before.y).toBeGreaterThan(0)

    // Open the header dropdown lang switcher and pick English.
    await page.locator('.lang-switcher-btn').click()
    await page.getByRole('button', { name: 'en', exact: true }).click()

    // Both the locale prefix and the section hash must survive the switch.
    await expect(page).toHaveURL(/\/en\/?#focus$/)

    // PM2 parity: the locale switch is a client-side navigation that preserves
    // the current scroll position — no top-of-page restart, no smooth scroll
    // animation from the top down to the anchor. The scroll position must stay
    // at the section (not 0) and remain within a small tolerance of its value
    // before the switch.
    await page.waitForTimeout(400)
    const after = await page.evaluate(() => ({ y: window.scrollY, hash: location.hash }))
    expect(after.hash).toBe('#focus')
    expect(after.y).toBeGreaterThan(0)
    expect(Math.abs(after.y - before.y)).toBeLessThan(300)

    // The section itself is still in the viewport after the switch.
    await expect(page.locator('#focus')).toBeInViewport()

    // REAL language change — the runtime locale must switch, not only the URL.
    // 1. The active switcher label reflects the new locale.
    await expect(page.locator('header .lang-switcher-code')).toHaveText('EN')
    // 2. A translated UI string differs between the source (ru) and target (en)
    //    locales: the header nav "Portfolio" item renders the en translation.
    await expect(page.locator('header nav a[href="/en/portfolio"]')).toHaveText('Portfolio')
  })

  test('header nav links keep the active locale prefix (non-default locale)', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')

    // The portfolio nav target is a page-mode route — must stay under /en/.
    await expect(page.locator('header nav a[href="/en/portfolio"]')).toBeVisible()
    // Onepager section anchors keep their hash under the locale prefix.
    await expect(page.locator('header nav a[href="/en/#about"]')).toBeVisible()
    await expect(page.locator('header nav a[href="/en/#contact"]')).toBeVisible()
  })

  test('hero CTAs keep the active locale prefix (non-default locale)', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#hero a[href="/en/#focus"]')).toBeVisible()
    await expect(page.locator('#hero a[href="/en/#about"]')).toBeVisible()
  })

  test('default locale renders unprefixed canonical URLs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Default locale (ru) keeps the canonical form — no prefix, hash intact.
    await expect(page.locator('header nav a[href="/portfolio"]')).toBeVisible()
    await expect(page.locator('header nav a[href="/#about"]')).toBeVisible()
  })
})
