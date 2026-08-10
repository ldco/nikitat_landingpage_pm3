/**
 * Made-By logo resolution (PM v2 getEffectiveLang + getLogo parity)
 *
 * Shared by MadeBy (footer) and SectionF22 (project) so the same brand
 * asset resolves identically everywhere on the page. Previously each
 * component re-implemented this with diverging locale logic (the footer
 * always picked LOCALES[0], F22 resolved the active locale), causing the
 * footer and F22 to show different logo files for the same locale.
 *
 * The locale-resolution rule itself now lives in the single shared helper
 * `$lib/utils/brand-logo` (used by Logo.svelte, MadeBy.svelte and
 * SectionF22.svelte) so all branding assets honor the same configured
 * `assetLangFallback` — no ad-hoc maps.
 */
import { brandLogoSrc, type BrandLogoConfig } from './brand-logo'

/** Backward-compatible alias for the shared brand-logo config contract. */
export type MadeByLogoConfig = BrandLogoConfig

/** PM v2 getLogo: theme inversion — light UI shows the 'dark' file, dark UI the 'light' file. */
export function madeByLogoSrc(config: BrandLogoConfig, lang: string, theme: 'light' | 'dark'): string {
  const fileTheme = theme === 'dark' ? 'light' : 'dark'
  return brandLogoSrc(config, lang, fileTheme, 'horizontal')
}
