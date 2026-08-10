/**
 * Brand logo locale resolution — the ONE shared rule for all branding assets.
 *
 * Used by the header Logo (src/lib/components/atoms/Logo.svelte), the footer
 * made-by logo (MadeBy.svelte) and the project SectionF22 so every brand
 * asset resolves the same way for the same locale. Previously the Logo
 * component carried its own ad-hoc fallback map that disagreed with the
 * configured `assetLangFallback` (footer/F22), producing inconsistent files
 * for unsupported locales (fr/he).
 *
 * `assetLangFallback` is a BRANDING-ASSET map, not an i18n fallback: it maps
 * a locale that has no logo file on disk to the language suffix of the logo
 * file that should be served instead.
 *
 * Rule (PM v2 useLogo.ts parity): direct locale match when an asset exists,
 * else the configured `assetLangFallback[lang]`, else the project default locale.
 */

export interface BrandLogoConfig {
  /** Asset directory, e.g. '/logos' or '/madebylogos'. */
  basePath: string
  /** Logo filenames available on disk, e.g. 'horizontal_dark_en'. */
  available: readonly string[]
  /**
   * Branding-asset language fallback: locale → logo-file language suffix.
   * Only locales WITHOUT a direct logo file need an entry (e.g. fr → en);
   * a locale missing from here falls back to defaultLang.
   */
  assetLangFallback: Record<string, string>
  /** Project default locale (LOCALES[0]). */
  defaultLang: string
}

/** Resolve a locale to the asset language suffix that has a direct match. */
export function resolveBrandLogoLang(config: BrandLogoConfig, lang: string): string {
  const hasDirect = config.available.some(name => name.endsWith(`_${lang}`))
  if (hasDirect) return lang
  return config.assetLangFallback[lang] ?? config.defaultLang
}

/**
 * Full asset URL for a logo variant.
 *
 * @param fileTheme — the FILE theme ('light' file for dark UI, 'dark' file
 *   for light UI). Callers decide the actual theme first; this helper only
 *   maps the resolved language suffix.
 * @param shape — 'horizontal' | 'circle'
 */
export function brandLogoSrc(
  config: BrandLogoConfig,
  lang: string,
  fileTheme: 'light' | 'dark',
  shape: 'horizontal' | 'circle' = 'horizontal'
): string {
  return `${config.basePath}/${shape}_${fileTheme}_${resolveBrandLogoLang(config, lang)}.svg`
}
