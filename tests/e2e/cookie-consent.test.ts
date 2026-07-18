/**
 * Cookie consent E2E tests.
 *
 * Verifies declined users do not keep or receive non-essential preference cookies
 * after hard reloads.
 */
import { describe, expect, it } from 'vitest'
import { createPage, setup } from '@nuxt/test-utils/e2e'

const PREFERENCE_COOKIE_NAMES = [
  'pm-color-mode',
  'pm-theme-explicit',
  'pm-locale-explicit',
  'pm-i18n-redirected'
] as const
const CONSENT_COOKIE_NAME = 'pm-cookie-consent'
const CONSENT_STORAGE_KEY = 'pm-cookie-consent-v1'
const COLOR_MODE_STORAGE_KEY = 'pm-color-mode'

function setCookiePersistsPreference(setCookieHeader: string, cookieName: string) {
  return setCookieHeader
    .split(/,(?=\s*[^;,]+=)/)
    .some((cookie) => {
      const normalizedCookie = cookie.trim().toLowerCase()

      return normalizedCookie.startsWith(`${cookieName.toLowerCase()}=`)
        && !normalizedCookie.includes('max-age=0')
        && !normalizedCookie.includes('expires=thu, 01 jan 1970')
    })
}

describe('Cookie consent E2E', async () => {
  await setup({
    server: true,
    browser: true,
    browserOptions: {
      type: 'chromium'
    }
  })

  it('does not set preference cookies for declined users after hard reloads', async () => {
    const page = await createPage('/')
    const origin = new URL(page.url()).origin

    await page.context().addCookies(
      [
        {
          name: CONSENT_COOKIE_NAME,
          value: 'declined',
          url: origin
        },
        ...PREFERENCE_COOKIE_NAMES.map(name => ({
          name,
          value: 'stale',
          url: origin
        }))
      ]
    )
    await page.evaluate(
      ([consentKey, colorModeKey]) => {
        window.localStorage.setItem(consentKey, 'declined')
        window.localStorage.setItem(colorModeKey, 'dark')
      },
      [CONSENT_STORAGE_KEY, COLOR_MODE_STORAGE_KEY]
    )

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
    })

    const response = await page.reload({ waitUntil: 'networkidle' })
    const setCookieHeader = response?.headers()['set-cookie'] ?? ''

    for (const cookieName of PREFERENCE_COOKIE_NAMES) {
      expect(setCookiePersistsPreference(setCookieHeader, cookieName)).toBe(false)
    }

    const cookies = await page.context().cookies(origin)
    const cookieNames = cookies.map(cookie => cookie.name)

    for (const cookieName of PREFERENCE_COOKIE_NAMES) {
      expect(cookieNames).not.toContain(cookieName)
    }

    const storedColorMode = await page.evaluate(
      key => window.localStorage.getItem(key),
      COLOR_MODE_STORAGE_KEY
    )

    expect(storedColorMode).toBeNull()
    expect(cookies.find(cookie => cookie.name === CONSENT_COOKIE_NAME)?.value).toBe('declined')
  })
})
