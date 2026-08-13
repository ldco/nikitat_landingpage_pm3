/**
 * Playwright Global Setup — one-time admin authentication for the e2e suite.
 *
 * Runs once after the dev server is up and before any test: clears the seeded
 * master account's first-login hardening flag (same step the tests/api helper
 * performs) and logs in ONCE through the real login UI, persisting the session
 * (plus the pinned admin locale cookie) to `e2e-playwright/.auth/admin.json`.
 *
 * Every admin-journey test reuses this storage state via
 * `test.use({ storageState })` — a single login per run keeps the suite far
 * under the login rate limiter (5/15min per IP).
 */
import { chromium } from '@playwright/test'
import { config as loadEnv } from 'dotenv'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'

const AUTH_STATE = join(process.cwd(), 'e2e-playwright', '.auth', 'admin.json')

export default async function globalSetup(): Promise<void> {
  loadEnv()
  const email = process.env.PM_ADMIN_MASTER_EMAIL
  const password = process.env.PM_ADMIN_MASTER_PASSWORD
  if (!email || !password) {
    throw new Error(
      'Missing PM_ADMIN_MASTER_EMAIL / PM_ADMIN_MASTER_PASSWORD in .env — required for the admin e2e journeys'
    )
  }

  const seed = JSON.parse(
    readFileSync(join(process.cwd(), 'i18n', 'system-seed.json'), 'utf-8')
  ) as Array<{ locale: string; key: string; value: string }>
  const ru = (key: string): string => seed.find(e => e.locale === 'ru' && e.key === key)?.value ?? key

  // First-login hardening: clear the forced password-change flag so the login
  // lands on the admin shell instead of the change-password page.
  const db = new Database(join(process.cwd(), 'data', 'sqlite.db'))
  db.prepare('UPDATE users SET must_change_password = 0 WHERE email = ?').run(email)
  db.close()

  const browser = await chromium.launch()
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173'
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()
  try {
    await page.goto('/admin/login')
    // Pin the admin UI to the project default locale: detectAdminLocale prefers
    // the pm-locale cookie over accept-language, so the UI labels are stable.
    await context.addCookies([{ name: 'pm-locale', value: 'ru', url: page.url() }])
    // A vite cold start can delay hydration — wait for the JS modules to settle
    // before clicking, otherwise the submit falls back to a native POST (403).
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: ru('auth.login') }).click()
    await page.waitForURL(/\/admin\/?$/, { timeout: 15000 })
  } catch (e) {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
    throw new Error(
      `Admin login failed — is the dev server up and the DB seeded? (${e instanceof Error ? e.message : e})`
    )
  }

  mkdirSync(join(process.cwd(), 'e2e-playwright', '.auth'), { recursive: true })
  await context.storageState({ path: AUTH_STATE })
  await context.close()
  await browser.close()
}
