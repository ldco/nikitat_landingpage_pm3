import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { LOCALES, DEFAULT_LOCALE, type Locale } from '$lib/config/site'

export const localeSchema = z.enum(LOCALES as [Locale, ...Locale[]])

export const supportedLocalesText = LOCALES.join(', ')

function isSupportedLocale(code: string): code is Locale {
  return (LOCALES as readonly string[]).includes(code)
}

export function activeLocale(preferred: string | null | undefined): Locale {
  return preferred && isSupportedLocale(preferred) ? preferred : DEFAULT_LOCALE
}

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

/**
 * Resolve the admin locale from a request event.
 *
 * Admin routes are excluded from Paraglide's URL-prefix detection, so the
 * locale is resolved from the paraglide-locale preference cookie or the
 * Accept-Language header, falling back to the project default locale.
 */
export function detectAdminLocale(event: RequestEvent): Locale {
  const preferred = event.cookies.get('paraglide-locale')
  const header = event.request.headers.get('accept-language')
  return detectLocale(preferred, header)
}
