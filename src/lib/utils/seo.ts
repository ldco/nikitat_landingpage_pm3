/**
 * SEO metadata resolution — ONE shared contract for page titles/descriptions.
 *
 * Replaces hand-built titles that concatenated the raw `SEO.title` config key
 * (e.g. `Legal — seo.defaultTitle`). Every public route renders through the
 * `Seo` component, which resolves text from:
 *   1. publicSettings (admin-managed `seo.title` / `seo.description` rows) —
 *      applied for the DEFAULT locale only, because the settings row is a
 *      single global value (no per-locale dimension);
 *   2. the i18n catalog (`seo.defaultTitle` / `seo.defaultDescription`) so
 *      EVERY locale has a real, translated default — never a raw key string.
 */
import { useSettings } from '$lib/stores/settings.svelte'
import { t } from '$lib/stores/content.svelte'
import { DEFAULT_LOCALE } from '$lib/config/site'
import { languageTag } from '$lib/paraglide/runtime.js'

/** True when the active locale is the project's default locale. */
function isDefaultLocale(): boolean {
  return languageTag() === DEFAULT_LOCALE
}

/** Site-wide default title: admin settings (default locale only), then translated i18n default. */
export function resolveSiteTitle(): string {
  const settings = useSettings()
  const configured = settings.seoTitle
  if (configured && isDefaultLocale()) return configured
  return t('seo.defaultTitle')
}

/** Site-wide default description: admin settings (default locale only), then translated i18n default. */
export function resolveSiteDescription(): string {
  const settings = useSettings()
  const configured = settings.seoDescription
  if (configured && isDefaultLocale()) return configured
  return t('seo.defaultDescription')
}

/**
 * Full page title: `<page title> — <site name>` for subpages, or the bare
 * site name for the homepage.
 */
export function resolvePageTitle(pageTitle?: string): string {
  const siteTitle = resolveSiteTitle()
  if (!pageTitle) return siteTitle
  return `${pageTitle} — ${siteTitle}`
}
