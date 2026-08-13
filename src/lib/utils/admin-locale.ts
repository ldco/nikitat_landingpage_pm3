/**
 * Admin Locale helpers — shared fallback policy for admin pages.
 *
 * Admin pages that render a locale tab set (translations, legal) start on the
 * first configured locale. The server always provides `data.locales` (the
 * project's LOCALE_STRINGS, non-empty by contract), so this helper only falls
 * back to the shared DEFAULT_LOCALE when the list is absent/empty — it never
 * invents a language code on the client.
 */
import { DEFAULT_LOCALE } from '$lib/config/site'

export function resolveInitialLocale(locales: readonly string[] | undefined): string {
  return (locales && locales.length > 0 ? locales[0] : undefined) ?? DEFAULT_LOCALE
}
