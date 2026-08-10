/**
 * Visual Regression Tests — PM3 (audit E-2 / Step 14)
 *
 * Captures screenshots of the homepage sections for visual comparison so a
 * refactor of any section is verifiable via `npm run test:e2e`.
 *
 * Run: npm run test:e2e
 * Update snapshots: npm run test:e2e:update
 */
import { test, expect } from '@playwright/test'

test.describe('Visual Regression — PM3 homepage', () => {
  test('full homepage renders (desktop)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Let reveal/scroll animations settle before capturing
    await page.waitForTimeout(600)
    await expect(page).toHaveScreenshot('homepage-desktop.png', { fullPage: true })
  })

  test('homepage mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)
    await expect(page).toHaveScreenshot('homepage-mobile.png', { fullPage: true })
  })

  test('hero section', async ({ page }) => {
    await page.goto('/#hero')
    await page.waitForLoadState('networkidle')
    const hero = page.locator('#hero')
    await expect(hero).toBeVisible()
    await expect(hero).toHaveScreenshot('hero-section.png')
  })

  test('about section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const about = page.locator('#about')
    await about.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    await expect(about).toHaveScreenshot('about-section.png')
  })
})
