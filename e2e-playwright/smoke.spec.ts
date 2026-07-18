import { expect, test } from '@playwright/test'

test.describe('required smoke checks', () => {
  test('home page responds and renders document content', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('body')).toBeVisible()
    await expect(page).toHaveTitle(/.+/)
  })

  test('admin login page renders the login form shell', async ({ page }) => {
    await page.goto('/admin/login')

    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible()
  })
})
