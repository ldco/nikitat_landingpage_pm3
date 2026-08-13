/**
 * Locale-Aware Navigation Tests — PM3
 *
 * Covers the PM v2 locale contract on the real routed app:
 *   1. Changing language from a mid-page onepager section keeps BOTH the
 *      target locale prefix AND the section hash (no page-top reset).
 *   2. Internal public links (header nav, hero CTA) carry the active locale
 *      prefix for non-default locales instead of raw root-relative hrefs.
 *
 * The target locale and the expected URLs are all derived from the shared
 * locale configuration (LOCALES / DEFAULT_LOCALE), so the suite keeps
 * validating the contract after the configured locale set changes. The
 * locale-prefix tests require a NON-default locale: for a single-locale
 * project they are skipped (test.skip(!hasNonDefault)) instead of asserting on
 * a fake default-locale fallback — the default locale renders unprefixed
 * canonical URLs, which the last test covers.
 *
 * Run: npm run test:e2e
 */
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LOCALES, DEFAULT_LOCALE } from '../src/project/site-config'

// The locale the tests switch to / navigate under: the first non-default one.
// Undefined for single-locale projects — the non-default tests are skipped.
const nonDefault = LOCALES.filter(l => l !== DEFAULT_LOCALE)
const target = nonDefault[0]
const hasNonDefault = target !== undefined
const targetCode = target ? target.toUpperCase() : ''
const portfolioLabel = target ? seedValue(target, 'nav.portfolio') : ''
const localizedPortfolio = target ? `/${target}/portfolio` : ''
const localizedSection = (hash: string) => (target ? `/${target}/${hash}` : '')

/** Read the seeded translation for a key in a locale (the runtime source). */
function seedValue(locale: string, key: string): string {
  const seed = JSON.parse(
    readFileSync(join(process.cwd(), 'i18n', 'system-seed.json'), 'utf-8')
  ) as Array<{ locale: string; key: string; value: string }>
  const row = seed.find(e => e.locale === locale && e.key === key)
  if (!row) throw new Error(`Missing seed catalog entry ${locale}:${key}`)
  return row.value
}

test.describe('Locale-aware navigation', () => {
  test('language switch from a section keeps the hash, scroll position and locale prefix', async ({ page }) => {
    test.skip(!hasNonDefault, 'requires a configured non-default locale')
    await page.goto('/#focus')
    await page.waitForLoadState('networkidle')
    // Let the initial anchor scroll settle before recording the position.
    await page.waitForTimeout(400)

    const before = await page.evaluate(() => ({ y: window.scrollY, hash: location.hash }))
    expect(before.hash).toBe('#focus')
    // The section anchor scrolls the page down — the switch must not restart from the top.
    expect(before.y).toBeGreaterThan(0)

    // Open the header dropdown lang switcher and pick the target locale.
    await page.locator('.lang-switcher-btn').click()
    await page.getByRole('button', { name: target, exact: true }).click()

    // Both the locale prefix and the section hash must survive the switch.
    await expect(page).toHaveURL(new RegExp(`/${target}/?#focus$`))

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
    await expect(page.locator('header .lang-switcher-code')).toHaveText(targetCode)
    // 2. The header nav "Portfolio" item renders the target locale's
    //    translation (the default locale's value is a different string).
    await expect(page.locator(`header nav a[href="${localizedPortfolio}"]`)).toHaveText(
      portfolioLabel
    )
  })

  test('header nav links keep the active locale prefix (non-default locale)', async ({ page }) => {
    test.skip(!hasNonDefault, 'requires a configured non-default locale')
    await page.goto(`/${target}`)
    await page.waitForLoadState('networkidle')

    // The portfolio nav target is a page-mode route — must stay under /<target>/.
    await expect(page.locator(`header nav a[href="${localizedPortfolio}"]`)).toBeVisible()
    // Onepager section anchors keep their hash under the locale prefix.
    await expect(page.locator(`header nav a[href="${localizedSection('#about')}"]`)).toBeVisible()
    await expect(page.locator(`header nav a[href="${localizedSection('#contact')}"]`)).toBeVisible()
  })

  test('hero CTAs keep the active locale prefix (non-default locale)', async ({ page }) => {
    test.skip(!hasNonDefault, 'requires a configured non-default locale')
    await page.goto(`/${target}`)
    await page.waitForLoadState('networkidle')

    await expect(page.locator(`#hero a[href="${localizedSection('#focus')}"]`)).toBeVisible()
    await expect(page.locator(`#hero a[href="${localizedSection('#about')}"]`)).toBeVisible()
  })

  test('default locale renders unprefixed canonical URLs', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // The default locale keeps the canonical form — no prefix, hash intact.
    await expect(page.locator('header nav a[href="/portfolio"]')).toBeVisible()
    await expect(page.locator('header nav a[href="/#about"]')).toBeVisible()
  })
})
