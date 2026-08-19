/**
 * Translations Store — UNIFIED source for ALL translations (system + content)
 *
 * The DATABASE is the canonical runtime owner (PM v2 parity): the root
 * layout seeds this store from the translations table (seeded from
 * `i18n/system-seed.json` + `src/project/content.json`), so admin edits
 * take effect at runtime. `messages/*.json` are GENERATED Paraglide
 * artifacts — they only serve as the compile-time fallback below.
 *
 * Lookup chain (documented in AGENTS.md / i18n policy):
 *   1. Database content translations (seeded from i18n/system-seed.json +
 *      src/project/content.json) — the runtime source of truth
 *   2. Framework message catalog (Paraglide messages via $lib/i18n) — the
 *      key is dotted (sections.testimonials) and mapped to the compiled
 *      snake_case message function (sections_testimonials). This catalog is
 *      generated from i18n/system-seed.json, so 1 and 2 never diverge.
 *   3. Explicit fallback value passed as the second argument
 *   4. The key itself as a last resort
 *
 * Usage:
 *   t('hero.title')              — DB content → Paraglide → key
 *   t('hero.title', 'Default')   — DB content → Paraglide → 'Default' → key
 *   t('common.goToImage', { i: 5 }) — parameter substitution {i}→5
 */
import * as m from '$lib/i18n'

let _translations = $state<Record<string, string>>({})

export function initContent(translations: Record<string, string>) {
  _translations = translations
}

/**
 * Resolve a dotted key against the Paraglide message catalog (a.b → a_b).
 * Params are forwarded so catalog messages with {param} placeholders work.
 *
 * The catalog module is a generated namespace of message functions, so a
 * computed-key lookup needs an index-signature view of it; the values are
 * runtime-checked functions and invoked with the uniform (optional params)
 * contract every Paraglide message shares.
 */
function paraglideMessage(key: string, params?: Record<string, unknown>): string | undefined {
  const msgKey = key.replace(/\./g, '_')
  const msgModule = m as Record<string, unknown>
  if (!(msgKey in msgModule)) return undefined
  const fn = msgModule[msgKey]
  if (typeof fn !== 'function') return undefined
  return (fn as (p?: Record<string, unknown>) => string)(params)
}

export function t(key: string, fallbackOrParams?: string | Record<string, unknown>): string {
  let text: string | undefined = _translations[key]

  if (text === undefined) {
    const params = fallbackOrParams && typeof fallbackOrParams === 'object' ? fallbackOrParams : undefined
    text = paraglideMessage(key, params)
  }
  if (text === undefined && typeof fallbackOrParams === 'string') {
    text = fallbackOrParams
  }
  if (text === undefined) {
    text = key
  }

  if (fallbackOrParams && typeof fallbackOrParams === 'object') {
    for (const [k, v] of Object.entries(fallbackOrParams)) {
      text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v))
    }
  }
  return text
}

export function hasKey(key: string): boolean { return key in _translations }
export function allTranslations(): Record<string, string> { return _translations }
