/**
 * Navigation Utilities
 *
 * Config-driven helper functions for navigation and routing.
 * Supports onepager (anchor) and SPA (route) modes.
 */
import { FEATURES, HOMEPAGE_SECTIONS, NAV_ITEMS, type NavItem } from '$lib/config/site'

/**
 * Resolve a section ID to its href based on render mode.
 * Onepager: anchors (#about)
 * SPA: routes (/about)
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
 * Get the current section ID from a URL.
 */
export function getSectionFromUrl(url: URL | string): string | null {
  const path = typeof url === 'string' ? url : url.pathname
  let hash = ''
  if (typeof url !== 'string') {
    hash = url.hash ? url.hash.replace('#', '') : ''
  }

  // Check hash first (onepager mode)
  if (hash && HOMEPAGE_SECTIONS.some(s => s.id === hash)) {
    return hash
  }

  // Check path (SPA mode)
  const match = path.match(/^\/([^/]+)/)
  if (match?.[1] && HOMEPAGE_SECTIONS.some(s => s.id === match[1])) {
    return match[1]
  }

  return null
}

/**
 * Build nav items with resolved hrefs.
 */
export function getResolvedNavItems(): Array<NavItem & { resolvedHref: string }> {
  return NAV_ITEMS.map(item => ({
    ...item,
    resolvedHref: item.href.startsWith('/#')
      ? resolveSectionHref(item.href.slice(2))
      : item.href
  }))
}
