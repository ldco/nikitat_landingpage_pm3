/**
 * Made-By logo resolution (PM v2 getEffectiveLang + getLogo parity)
 *
 * Shared by MadeBy (footer) and SectionF22 (project) so the same brand
 * asset resolves identically everywhere on the page. Previously each
 * component re-implemented this with diverging locale logic (the footer
 * always picked LOCALES[0], F22 resolved the active locale), causing the
 * footer and F22 to show different logo files for the same locale.
 */

export interface MadeByLogoConfig {
  basePath: string
  /** Logo filenames available on disk, e.g. 'horizontal_dark_en'. */
  available: readonly string[]
  /** Per-locale fallback map; a locale missing from here falls back to defaultLang. */
  langFallback: Record<string, string>
  /** Project default locale (LOCALES[0]). */
  defaultLang: string
}

/** PM v2 getEffectiveLang: direct logo if available, else langFallback, else default locale. */
export function resolveMadeByLang(config: MadeByLogoConfig, lang: string): string {
  const hasDirect = config.available.some(name => name.endsWith(`_${lang}`))
  if (hasDirect) return lang
  return config.langFallback[lang] ?? config.defaultLang
}

/** PM v2 getLogo: theme inversion — light UI shows the 'dark' file, dark UI the 'light' file. */
export function madeByLogoSrc(config: MadeByLogoConfig, lang: string, theme: 'light' | 'dark'): string {
  const fileTheme = theme === 'dark' ? 'light' : 'dark'
  return `${config.basePath}/horizontal_${fileTheme}_${resolveMadeByLang(config, lang)}.svg`
}
