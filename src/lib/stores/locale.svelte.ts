/**
 * Reactive Locale Store
 *
 * The Paraglide runtime's `languageTag()` is a plain module-binding reassignment
 * (`setLanguageTag` replaces the exported function) — NOT Svelte-reactive, so
 * `$derived(languageTag())` in a component never re-runs after a client-side
 * locale switch. This store mirrors the runtime tag in `$state` so `$derived`
 * consumers (nav links, logo assets, switcher label, localized hrefs) stay in
 * sync when LangSwitcher switches language without a full page reload.
 *
 * Contract:
 * - SSR: `currentLocale()` reads the paraglide runtime live (per-request tag
 *   set by the i18n handle) — `_clientLocale` is null on the server.
 * - Client: `syncLocaleFromHtml()` (called once from the root layout as a
 *   BOOTSTRAP step during hydration) seeds `_clientLocale` from the SSR
 *   `<html lang>`; every subsequent switch goes through `setLocale()`.
 */
import { languageTag, setLanguageTag, isAvailableLanguageTag } from '$lib/paraglide/runtime.js'
import type { AvailableLanguageTag } from '$lib/paraglide/runtime.js'

let _clientLocale = $state<string | null>(null)

/** Reactive current locale (null client-side until the bootstrap sync runs). */
export function currentLocale(): string {
  return _clientLocale ?? languageTag()
}

/**
 * Switch the active locale: updates the Paraglide runtime tag (system
 * translations, content store lookups) AND the reactive store (component
 * re-render). Callers are responsible for any URL navigation afterwards.
 */
export function setLocale(code: string): void {
  setLanguageTag(code as AvailableLanguageTag)
  _clientLocale = code
}

/**
 * Bootstrap-only hydration sync: align the store with the SSR `<html lang>`.
 * Runs exactly once from the root layout before children render. It is NOT the
 * language-switch mechanism — LangSwitcher/setLocale() owns that.
 */
export function syncLocaleFromHtml(): void {
  if (typeof document === 'undefined') return
  const lang = document.documentElement.lang
  if (lang && isAvailableLanguageTag(lang)) {
    setLanguageTag(lang as AvailableLanguageTag)
    _clientLocale = lang
  }
}
