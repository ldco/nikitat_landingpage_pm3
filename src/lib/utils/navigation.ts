/**
 * Navigation Utilities
 *
 * Config-driven helper functions for navigation and routing.
 * Supports onepager (anchor) and SPA (route) modes.
 *
 * URL CONTRACT (locale-aware): config stores CANONICAL targets — locale-less
 * paths like '/#about' or '/portfolio'. Every public-site URL is derived at
 * render time through `localizedHref` / `localizedSectionHref` / `localizeUrl`,
 * which prefix the active (or target) locale via the paraglide i18n instance.
 * Raw root-relative hrefs in components are a bug: with prefixDefaultLanguage
 * 'never', an unprefixed URL resolves to the DEFAULT locale, so an /en/ visitor
 * clicking `/blog` would land on the Russian blog. NEVER render item.href raw.
 */
import { FEATURES, HOMEPAGE_SECTIONS, NAV_ITEMS, type NavItem } from '$lib/config/site'
import { i18n } from '$lib/i18n'
import type { AvailableLanguageTag } from '$lib/paraglide/runtime.js'

/**
 * Canonical (locale-less) target for a section id.
 * Onepager: anchor (#about) — SPA: route (/about).
 */
export function resolveSectionHref(id: string): string {
  const section = HOMEPAGE_SECTIONS.find(s => s.id === id)
  if (section?.renderMode === 'page') return `/${id}`
  return FEATURES.onepager ? `/#${id}` : `/${id}`
}

/**
 * Check if a section renders as a standalone page.
 */
export function isSectionPage(id: string): boolean {
  const section = HOMEPAGE_SECTIONS.find(s => s.id === id)
  return section?.renderMode === 'page'
}

/**
 * Get the current section ID from a URL (locale-aware: the path is
 * canonicalized through i18n.route so a localized '/en/portfolio' resolves).
 */
export function getSectionFromUrl(url: URL | string): string | null {
  const raw = typeof url === 'string' ? url : url.href
  const [rawPath, rawHash = ''] = raw.split('#')
  const hash = rawHash.replace(/[?#].*$/, '')
  const path = typeof url === 'string' ? (rawPath ?? '') : url.pathname

  // Check hash first (onepager mode)
  if (hash && HOMEPAGE_SECTIONS.some(s => s.id === hash)) {
    return hash
  }

  // Check path (SPA mode) — strip any locale prefix first.
  const canonical = i18n.route(path)
  const match = canonical.match(/^\/([^/]+)/)
  if (match?.[1] && HOMEPAGE_SECTIONS.some(s => s.id === match[1])) {
    return match[1]
  }

  return null
}

/**
 * Localize a canonical path (no locale prefix) for a target locale, preserving
 * any `?query` and `#hash`. Canonical form never carries a locale prefix.
 * @example localizedHref('/blog', 'en') → '/en/blog'
 * @example localizedHref('/#about', 'en') → '/en/#about'
 * @example localizedHref('/blog?page=2#comments', 'fr') → '/fr/blog?page=2#comments'
 */
export function localizedHref(canonicalPath: string, locale: string): string {
  const hashIndex = canonicalPath.indexOf('#')
  const hash = hashIndex >= 0 ? canonicalPath.slice(hashIndex) : ''
  const beforeHash = hashIndex >= 0 ? canonicalPath.slice(0, hashIndex) : canonicalPath
  const queryIndex = beforeHash.indexOf('?')
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : ''
  const path = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash
  const resolved = i18n.resolveRoute(path, locale as AvailableLanguageTag)
  return `${resolved}${query}${hash}`
}

/**
 * Localized href for a section id (onepager anchors keep their hash).
 * @example localizedSectionHref('about', 'en') → '/en/#about'
 * @example localizedSectionHref('about', 'ru') → '/#about' (default locale)
 */
export function localizedSectionHref(id: string, locale: string): string {
  return localizedHref(resolveSectionHref(id), locale)
}

/**
 * Rebuild a full URL for a target locale while preserving `search` and `hash`.
 * Used by LangSwitcher so a language switch from `/#section` (or any stateful
 * URL) lands on the equivalent localized URL instead of the page top.
 * @example localizeUrl('http://host/#focus', 'en') → 'http://host/en/#focus'
 * @example localizeUrl('http://host/en/blog/post?page=2#c', 'fr') → 'http://host/fr/blog/post?page=2#c'
 */
export function localizeUrl(url: string, locale: string): string {
  const parsed = new URL(url, 'http://localhost')
  const canonical = i18n.route(parsed.pathname)
  let resolved = i18n.resolveRoute(canonical, locale as AvailableLanguageTag)
  // The root path is serialized with or without a trailing slash depending on
  // the runtime; normalize it so a section hash stays on the canonical shape
  // ('/en/#focus', not '/en#focus').
  if (canonical === '/' && parsed.hash && !resolved.endsWith('/')) {
    resolved = `${resolved}/`
  }
  return `${resolved}${parsed.search}${parsed.hash}`
}

/**
 * Build nav items with locale-resolved hrefs (active locale).
 * Config stores canonical targets; the final href is always derived per locale.
 */
export function getResolvedNavItems(locale: string): Array<NavItem & { resolvedHref: string }> {
  return NAV_ITEMS.map(item => ({
    ...item,
    resolvedHref: localizedHref(item.href, locale)
  }))
}
