/**
 * i18n — Paraglide runtime integration
 *
 * Re-exports Paraglide messages and creates the i18n instance
 * for locale detection, routing, and hooks.
 *
 * RUNTIME CONTRACT: the DATABASE is the runtime owner of ALL translations.
 * Components MUST read text through `t()` from `$lib/stores/content.svelte`
 * (DB-first, Paraglide fallback) — never through `m.*()` directly, so admin
 * edits to the translations table apply live.
 *
 * Usage in server code:
 *   import { i18n } from '$lib/i18n'
 *   i18n.resolveRoute(pathname, localeCode)
 */

import * as runtime from '$lib/paraglide/runtime.js'
import { createI18n } from '@inlang/paraglide-sveltekit'
import { LOCALES, isRtlLocale } from '$lib/config/site'

// The compiled Paraglide catalog is the FALLBACK branch of the unified
// `t()` helper (content store) — components never import it directly.
export * from '$lib/paraglide/messages.js'

// Create i18n instance with locale detection strategy
// Strategy (in order): URL path prefix → cookie → browser → defaultLocale
const textDir: Record<string, 'ltr' | 'rtl'> = {}
for (const l of LOCALES) textDir[l] = isRtlLocale(l) ? 'rtl' : 'ltr'

export const i18n = createI18n(runtime, {
  prefixDefaultLanguage: 'never',
  textDirection: textDir,
  exclude: ['/api/', '/admin/'], // API and admin routes are not translated
  seo: {
    noAlternateLinks: false
  }
})
