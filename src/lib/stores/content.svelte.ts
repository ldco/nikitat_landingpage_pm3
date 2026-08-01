/**
 * Content Translations Store
 *
 * PM v2 parity: mirrors vue-i18n `t()` for DB-resident content translations.
 * Populated once from server layout load (SSR-safe, no client fetch needed).
 *
 * Usage:
 *   import { t } from '$lib/stores/content.svelte'
 *   const title = t('hero.title', 'Default')
 */
let _translations = $state<Record<string, string>>({})

/** Called by +layout.svelte on every server-loaded page. */
export function initContent(translations: Record<string, string>) {
  _translations = translations
}

/**
 * Look up a content translation key.
 * Falls back to `fallback` if not found, or the key itself if no fallback.
 */
export function t(key: string, fallback?: string): string {
  return _translations[key] ?? fallback ?? key
}

/** Check if a key exists (PM v2 `te()` equivalent). */
export function hasKey(key: string): boolean {
  return key in _translations
}

/** Get all translations (for iteration). */
export function allTranslations(): Record<string, string> {
  return _translations
}
