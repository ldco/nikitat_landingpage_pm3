import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte'
import { initContent } from '$lib/stores/content.svelte'
import { LOCALES, DEFAULT_LOCALE, LOCALE_CONFIG } from '$lib/config/site'
import LegalPage from '../../../src/routes/admin/legal/+page.svelte'

/**
 * Regression test (review comment 3): the legal editor used to pre-fill every
 * NON-active locale with '' during the synchronous init pass. A locale that
 * had existing documents therefore appeared empty on its tab — the tab-switch
 * effect only populated locales whose value was `undefined`, and '' is not
 * undefined. The fix hydrates EVERY locale from the server-provided `byLocale`
 * set in the first pass, so switching from the first locale tab to another
 * locale with existing content shows that content immediately.
 *
 * The regression is asserted on RUNTIME output: render the actual page, switch
 * tabs, and verify the document textareas + status grid read the hydrated
 * values for the target locale.
 *
 * The tab-switch test requires a SECOND (non-default) locale to switch to; for
 * a single-locale project it is skipped (it.skipIf(!second)) — there is no
 * second tab to switch to, so the assertion would be meaningless.
 */

// A locale set that deliberately includes existing content for the SECOND
// tab (the tab the pre-fill bug blanked out).
const byLocale: Record<string, Array<{ slug: string; content: string }>> = {}
for (const locale of LOCALES) {
  byLocale[locale] = ['privacy-policy', 'personal-data-policy', 'terms-of-service'].map(
    (slug, i) => ({ slug, content: `DOC-${locale}-${slug}-${i + 1}` })
  )
}

// The tab to switch to: the first configured NON-default locale (undefined for
// single-locale projects — the switch test is skipped then).
const second = LOCALES.filter(l => l !== DEFAULT_LOCALE)[0]

const pageData = {
  byLocale,
  settings: {},
  locales: LOCALES,
  localeNames: Object.fromEntries(
    LOCALES.map(locale => [locale, LOCALE_CONFIG[locale as keyof typeof LOCALE_CONFIG].name])
  )
}

vi.mock('$app/stores', async () => {
  const { readable: makeReadable } = await import('svelte/store')
  return {
    page: makeReadable({ data: { t: {} }, form: null }),
    navigating: makeReadable(null),
    updated: makeReadable(false)
  }
})

vi.mock('$lib/stores/overlays.svelte', () => ({
  getOverlaysState: () => ({
    showToast: vi.fn(),
    confirm: vi.fn(),
    dismissToast: vi.fn(),
    resolveConfirm: vi.fn()
  }),
  setOverlaysContext: () => {}
}))

function tick(): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  // Deterministic document labels for the docLabel() footer keys.
  initContent({
    'footer.privacy': 'Privacy Policy',
    'footer.personalData': 'Personal Data Policy',
    'footer.terms': 'Terms of Service',
    'common.save': 'Save',
    'common.saving': 'Saving...',
    'common.saved': 'Saved'
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('admin legal editor — per-locale document hydration', () => {
  it.skipIf(!second)(
    'switching from the first locale tab to another locale keeps its existing content',
    async () => {
      const first = DEFAULT_LOCALE
      const secondLocale = second as string
      const secondLabel = LOCALE_CONFIG[secondLocale as keyof typeof LOCALE_CONFIG].name

      render(LegalPage, { props: { data: pageData } })

      // The first tab is active by default and renders its hydrated content.
      expect(screen.getByDisplayValue(`DOC-${first}-privacy-policy-1`)).toBeTruthy()

      // Switch to the second locale tab (existing content in byLocale).
      fireEvent.click(screen.getByRole('tab', { name: secondLabel }))
      await tick()

      // The regression: before the fix the second locale was pre-initialized to
      // '' and the tab showed a blank editor despite the DB having content.
      expect(screen.getByDisplayValue(`DOC-${secondLocale}-privacy-policy-1`)).toBeTruthy()
      expect(screen.getByDisplayValue(`DOC-${secondLocale}-terms-of-service-3`)).toBeTruthy()

      // The status grid reads the hydrated values for every locale — the second
      // locale's card reports all three documents complete (not "missing").
      expect(screen.getAllByText('3 of 3 documents complete').length).toBeGreaterThan(0)

      // No "missing document body" badge on the active document once the second
      // locale's real content is shown.
      expect(screen.queryByText(/missing body/i)).toBeNull()
    }
  )
})
