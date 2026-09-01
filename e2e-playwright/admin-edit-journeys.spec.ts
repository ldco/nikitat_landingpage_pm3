/**
 * Admin Edit Journeys — E2E coverage for the real admin edit workflows
 * (review: the broken admin edit journeys had no browser-level regression
 * coverage, so UI failures survived despite server-side fixes).
 *
 * Runs against the local dev server (`npm run test:e2e` → `npm run dev`) and
 * the local SQLite database (`./data/sqlite.db`). The suite authenticates ONCE
 * through the real login UI in `beforeAll` (also exercising the login
 * journey), persists the session to a shared storage state, and drives the
 * REAL UI journeys against it:
 *
 *   - /admin/users              — add-user modal (opens → fills → saves →
 *                                 closes) then delete via the row action
 *   - /admin/roles              — create-role modal (opens → saves → closes)
 *                                 then delete
 *   - /admin/translations       — locale-tab switch (on-demand load) and a
 *                                 full add → edit → delete of a throwaway key
 *   - /admin/faq/[id]/edit      — metadata form saves and redirects
 *   - /admin/portfolios/[id]/edit    — settings form saves and redirects
 *   - /admin/portfolios/[id]/items   — add-item modal (opens → saves → closes)
 *                                      then delete
 *
 * The admin UI renders in the project default locale (ru), so selectors
 * resolve labels from the shared seed catalog (i18n/system-seed.json) — the
 * same runtime source of truth the pages use. Mutations are additive and
 * self-cleaning: every journey uses unique throwaway values and removes what
 * it creates, so re-running the suite against a dev DB stays clean.
 *
 * Notes:
 *   - The login is rate-limited (5/15min/IP) — a single shared login keeps
 *     the whole suite well under the limit.
 *   - The admin tables render row actions on BOTH mobile (top of the card)
 *     and desktop (trailing actions column, PM2 parity), so the journeys run
 *     at the default desktop viewport and exercise the desktop actions.
 *
 * Run: npm run test:e2e
 */
import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Database from 'better-sqlite3'

const DB_PATH = join(process.cwd(), 'data', 'sqlite.db')
const AUTH_STATE = join(process.cwd(), 'e2e-playwright', '.auth', 'admin.json')

// Seed catalog → ru labels (the admin UI's default locale) for selectors.
const seed = JSON.parse(
  readFileSync(join(process.cwd(), 'i18n', 'system-seed.json'), 'utf-8')
) as Array<{ locale: string; key: string; value: string }>

function ru(key: string): string {
  const row = seed.find(e => e.locale === 'ru' && e.key === key)
  if (!row) throw new Error(`Missing ru catalog entry for ${key}`)
  return row.value
}

function firstId(table: string, label: string): number {
  const db = new Database(DB_PATH, { readonly: true })
  try {
    const row = db.prepare(`SELECT id FROM ${table} ORDER BY id LIMIT 1`).get() as
      | { id: number }
      | undefined
    if (!row) throw new Error(`${label}: nothing seeded in ${table} — run npm run db:seed`)
    return row.id
  } finally {
    db.close()
  }
}

// Every journey reuses the shared authenticated session (one login per run).
test.use({ storageState: AUTH_STATE })

test.describe.configure({ mode: 'serial' })

/** Navigate and wait for Svelte hydration before interacting (vite cold-start guard). */
async function gotoAdmin(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await waitHydrated(page)
}

async function waitHydrated(page: Page): Promise<void> {
  // A vite cold start can delay hydration — wait for the JS modules to settle
  // before interacting, otherwise clicks/submits fall back to native behavior
  // (no modal opens, forms POST natively and get 403 csrf.invalid).
  await page.waitForLoadState('networkidle', { timeout: 15000 })
}

/**
 * The shared AdminEditorPage form region — the SAME element on every editor
 * route (create and edit, every entity), so layout assertions written against
 * it stay valid when new AdminEditorPage routes are added.
 */
function editorForm(page: Page) {
  return page.getByTestId('admin-editor-form')
}

/**
 * Editor layout contract: the shared editor form must span the admin content
 * column (`--max-w-content` = 62.5rem) instead of collapsing into a narrow
 * left-aligned card. Regression: the portfolio editors overrode the shell with
 * `formClass="max-w-lg space-y-6"` (32rem), which this assertion fails.
 *
 * Must run at a desktop viewport — on a mobile viewport even a max-w-lg form
 * fills the screen, so the narrow-column regression is undetectable there.
 */
async function expectEditorFormFullWidth(page: Page): Promise<void> {
  const form = editorForm(page)
  await expect(form).toBeVisible()
  const box = await form.boundingBox()
  if (!box) throw new Error('editor form has no bounding box')
  // 768px sits between the narrow max-w-lg (512px) regression and the full
  // content column (~1000px at desktop), so either extreme fails safely.
  expect(box.width, 'editor form must span the admin content column').toBeGreaterThan(768)
}

test.describe('Admin edit journeys', () => {
  test('users: add and delete a user through the modal journey', async ({ page }) => {
    await gotoAdmin(page, '/admin/users')
    await expect(page.getByRole('button', { name: ru('admin.addUser') })).toBeVisible()

    const email = `e2e-user-${Date.now()}@example.com`
    const password = `E2e-User-${Date.now()}-q#7R`

    // Add: modal opens, form responds, save closes it and the row appears.
    await page.getByRole('button', { name: ru('admin.addUser') }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('#user-email').fill(email)
    await dialog.locator('#user-password').fill(password)
    await dialog.locator('#user-name').fill('E2E Journey User')
    await dialog.getByRole('button', { name: ru('common.save') }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const row = page.locator('tr', { hasText: email })
    await expect(row).toBeVisible()

    // Delete: row action → confirm dialog → row removed (cleanup).
    await row.getByRole('button', { name: ru('common.delete') }).click()
    await page.getByRole('dialog').getByRole('button', { name: ru('common.delete') }).click()
    await expect(page.locator('tr', { hasText: email })).toHaveCount(0)
  })

  test('roles: create and delete a role through the modal journey', async ({ page }) => {
    await gotoAdmin(page, '/admin/roles')
    await expect(page.getByRole('button', { name: ru('common.create') })).toBeVisible()

    const slug = `e2e-role-${Date.now()}`

    // Create: modal opens, fills, saves → closes; the role row appears.
    await page.getByRole('button', { name: ru('common.create') }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('#name').fill('E2E Journey Role')
    await dialog.locator('#slug').fill(slug)
    await dialog.getByRole('button', { name: ru('common.save') }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const row = page.locator('tr', { hasText: slug })
    await expect(row).toBeVisible()

    // Delete (cleanup).
    await row.getByRole('button', { name: ru('common.delete') }).click()
    await page.getByRole('dialog').getByRole('button', { name: ru('common.delete') }).click()
    await expect(page.locator('tr', { hasText: slug })).toHaveCount(0)
  })

  test('translations: switching locale tabs loads that locale on demand', async ({ page }) => {
    await gotoAdmin(page, '/admin/translations')
    await expect(page.getByRole('button', { name: ru('admin.addTranslation') })).toBeVisible()

    // The initial (default) locale renders namespace groups immediately.
    await expect(page.locator('.admin-translations button[aria-expanded]').first()).toBeVisible()

    // Switching to a non-default locale fetches its rows on demand; the
    // namespace groups only appear once the fetch resolves (a failed fetch
    // renders the error state instead, so this assertion catches it).
    await page.getByRole('tab', { name: 'English' }).click()
    await expect(page.locator('.admin-translations button[aria-expanded]').first()).toBeVisible({ timeout: 15000 })
  })

  test('translations: add, edit, and delete a key through the editor modal', async ({ page }) => {
    await gotoAdmin(page, '/admin/translations')
    await expect(page.getByRole('button', { name: ru('admin.addTranslation') })).toBeVisible()

    const key = `e2e.test.${Date.now()}`

    // Add (batch → all locales): modal opens, saves, closes.
    await page.getByRole('button', { name: ru('admin.addTranslation') }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('#translation-modal-key').fill(key)
    await dialog.locator('#translation-locale-ru').fill(`значение-${Date.now()}`)
    await dialog.locator('#translation-locale-en').fill(`value-${Date.now()}`)
    await dialog.getByRole('button', { name: ru('common.save') }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // The new namespace group appears in the (collapsed) list — expand it.
    const groupHeader = page.locator('button[aria-expanded]', { hasText: 'e2e' })
    await expect(groupHeader).toBeVisible()
    await groupHeader.click()

    // Edit: the row's edit action opens the modal, save closes it and refreshes the row.
    const editedValue = `edited-${Date.now()}`
    const row = page.locator('tr', { hasText: key })
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: ru('common.edit') }).click()
    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible()
    await editDialog.locator('#translation-modal-value').fill(editedValue)
    await editDialog.getByRole('button', { name: ru('common.save') }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('tr', { hasText: key })).toContainText(editedValue)

    // Delete (cleanup).
    await page.locator('tr', { hasText: key }).getByRole('button', { name: ru('common.delete') }).click()
    await page.getByRole('dialog').getByRole('button', { name: ru('common.delete') }).click()
    await expect(page.locator('tr', { hasText: key })).toHaveCount(0)
  })

  test('faq: edit page loads seeded data, saves, and redirects to the list', async ({ page }) => {
    const faqId = firstId('faq_items', 'FAQ')
    await gotoAdmin(page, `/admin/faq/${faqId}/edit`)
    // The form is pre-filled from the seeded row.
    await expect(page.locator('#slug')).toHaveValue(/.+/)

    // A change enables Save; saving redirects to the FAQ list (303). The
    // original category is restored afterwards so the journey leaves the
    // seeded row untouched (no e2e-category-* pollution in the DB).
    const originalCategory = await page.locator('#category').inputValue()
    await page.locator('#category').fill(`e2e-category-${Date.now()}`)
    await page.getByRole('button', { name: ru('common.save') }).click()
    await expect(page).toHaveURL(/\/admin\/faq\/?$/)

    await gotoAdmin(page, `/admin/faq/${faqId}/edit`)
    await page.locator('#category').fill(originalCategory)
    await page.getByRole('button', { name: ru('common.save') }).click()
    await expect(page).toHaveURL(/\/admin\/faq\/?$/)
  })

  test('portfolio: settings page saves metadata and redirects to the list', async ({ page }) => {
    const portfolioId = firstId('portfolios', 'Portfolio')
    await gotoAdmin(page, `/admin/portfolios/${portfolioId}/edit`)
    // The settings form is pre-filled and the content-edit path is the
    // primary header CTA (PM2-parity split).
    await expect(page.locator('#name')).toHaveValue(/.+/)
    await expect(page.getByRole('link', { name: ru('admin.editContent') })).toBeVisible()

    // A change enables Save; saving redirects to the list (303). The original
    // description is restored afterwards so the seeded row is left untouched.
    const originalDescription = await page.locator('#description').inputValue()
    await page.locator('#description').fill(`e2e-description-${Date.now()}`)
    await page.getByRole('button', { name: ru('common.save') }).click()
    await expect(page).toHaveURL(/\/admin\/portfolios\/?$/)

    await gotoAdmin(page, `/admin/portfolios/${portfolioId}/edit`)
    await page.locator('#description').fill(originalDescription)
    await page.getByRole('button', { name: ru('common.save') }).click()
    await expect(page).toHaveURL(/\/admin\/portfolios\/?$/)
  })

  test('portfolio: create and edit render the shared full-width editor form', async ({ page }) => {
    // Layout surfaces, not save flows: the editor form must span the admin
    // content column on both portfolio routes (regression: they were forced
    // to a narrow max-w-lg card via a per-route formClass override).
    await page.setViewportSize({ width: 1280, height: 800 })
    const portfolioId = firstId('portfolios', 'Portfolio')

    await gotoAdmin(page, '/admin/portfolios/create')
    await expectEditorFormFullWidth(page)

    await gotoAdmin(page, `/admin/portfolios/${portfolioId}/edit`)
    await expectEditorFormFullWidth(page)
  })

  test('portfolio: add and delete a content item through the items editor', async ({ page }) => {
    const portfolioId = firstId('portfolios', 'Portfolio')
    await gotoAdmin(page, `/admin/portfolios/${portfolioId}/items`)
    await expect(page.getByRole('button', { name: ru('admin.addItem') })).toBeVisible()

    const title = `e2e-item-${Date.now()}`

    // Add: modal opens, fills, saves → closes; the item card appears.
    await page.getByRole('button', { name: ru('admin.addItem') }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('#title').fill(title)
    await dialog.getByRole('button', { name: ru('common.save') }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const card = page.locator('div.grid > div', { hasText: title }).first()
    await expect(card).toBeVisible()

    // Delete (cleanup).
    await card.getByRole('button', { name: ru('common.delete') }).click()
    await page.getByRole('dialog').getByRole('button', { name: ru('common.delete') }).click()
    await expect(page.locator('div.grid > div', { hasText: title })).toHaveCount(0)
  })
})
