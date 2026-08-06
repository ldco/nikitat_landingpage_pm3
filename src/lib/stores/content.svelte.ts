/**
 * Translations Store — UNIFIED source for ALL translations (system + content)
 *
 * Lookup chain: DB → Paraglide fallback → key itself
 * Usage:
 *   t('hero.title')              — DB content
 *   t('hero.title', 'Default')   — DB content + string fallback
 *   t('common.goToImage', { i: 5 }) — parameter substitution {i}→5
 */
let _translations = $state<Record<string, string>>({})

export function initContent(translations: Record<string, string>) {
  _translations = translations
}

export function t(key: string, fallbackOrParams?: string | Record<string, unknown>): string {
  let text = _translations[key] ?? key

  if (fallbackOrParams && typeof fallbackOrParams === 'object') {
    for (const [k, v] of Object.entries(fallbackOrParams)) {
      text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v))
    }
  } else if (typeof fallbackOrParams === 'string' && !text) {
    text = fallbackOrParams
  }
  return text
}

export function hasKey(key: string): boolean { return key in _translations }
export function allTranslations(): Record<string, string> { return _translations }
