/**
 * Shared Locale Contract — the ONE source of truth for supported locales.
 *
 * Derived from the project/site config (`LOCALES`, `DEFAULT_LOCALE`), so
 * adding a language means editing `src/project/site-config.ts` — never this
 * file and never the server routes. Used for:
 *   - request validation (`localeSchema`)
 *   - locale detection from cookie / Accept-Language (`detectLocale`)
 *   - setup responses (`supportedLocalesText`)
 *
 * PM v2 parity: locales come from the config object, RTL is auto-detected
 * (see `isRtlLocale` in `$lib/config/site`), translations live in the DB.
 */
import { z } from 'zod'
import { LOCALES, DEFAULT_LOCALE, type Locale } from '$lib/config/site'

/** Zod enum of the configured locales — for query/param validation. */
export const localeSchema = z.enum(LOCALES as [Locale, ...Locale[]])

/** Human-readable supported-locale list for error/setup messages. */
export const supportedLocalesText = LOCALES.join(', ')

/** True when the code is one of the configured locales. */
function isSupportedLocale(code: string): code is Locale {
  return (LOCALES as readonly string[]).includes(code)
}

/**
 * Resolve the active locale: the configured locale when `preferred` is one,
 * otherwise the project default locale.
 */
export function activeLocale(preferred: string | null | undefined): Locale {
  return preferred && isSupportedLocale(preferred) ? preferred : DEFAULT_LOCALE
}

/**
 * Detect locale from a request: explicit preference (e.g. Paraglide cookie)
 * first, then the Accept-Language header, then the project default locale.
 */
export function detectLocale(preferred: string | null | undefined, acceptLanguage?: string | null): Locale {
  if (preferred && isSupportedLocale(preferred)) return preferred

  if (acceptLanguage) {
    for (const part of acceptLanguage.split(',')) {
      const code = (part.split(';')[0] ?? '').trim().split('-')[0] ?? ''
      if (isSupportedLocale(code)) return code
    }
  }
  return DEFAULT_LOCALE
}
