/**
 * i18n — Paraglide runtime integration
 *
 * Re-exports Paraglide messages and creates the i18n instance
 * for locale detection, routing, and hooks.
 *
 * Usage in components:
 *   import * as m from '$lib/i18n'
 *   <h1>{m.hero_title()}</h1>
 *
 * Usage in server code:
 *   import { i18n } from '$lib/i18n'
 *   i18n.resolveRoute('/about', 'ru')
 */

import * as runtime from '$lib/paraglide/runtime.js'
import { createI18n } from '@inlang/paraglide-sveltekit'

// Re-export all Paraglide messages for convenience
// import * as m from '$lib/i18n' — then use m.hero_title(), m.common_submit(), etc.
export * from '$lib/paraglide/messages.js'

// Create i18n instance with locale detection strategy
// Strategy (in order): URL path prefix → cookie → browser → defaultLocale
export const i18n = createI18n(runtime, {
  prefixDefaultLanguage: 'never', // Default locale (ru) has no prefix
  textDirection: {
    ru: 'ltr',
    en: 'ltr',
    fr: 'ltr',
    he: 'rtl'
  },
  exclude: ['/api/', '/admin/'], // API and admin routes are not translated
  seo: {
    noAlternateLinks: false
  }
})
