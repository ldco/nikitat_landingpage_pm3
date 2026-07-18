/**
 * Translation Classification Reference
 *
 * ARCHITECTURE (Phase 2 — Paraglide + DB split):
 *
 * Paraglide (compile-time, messages/*.json):
 *   UI strings: common.*, nav.*, auth.*, error.*, validation.*,
 *   cookies.*, theme.*, footer.*, sections.*, legal.*,
 *   pricing.*, setup.*, init.*, apiErrors.*
 *
 * DB (runtime, admin-editable via admin panel):
 *   Content: admin.*, settings.*, blog.*, team.*, portfolio.*,
 *   testimonials.*, features.*, faq.*, clients.*
 *
 * Paraglide keys are compiled into JS at build time.
 * DB keys are loaded at runtime and editable via admin panel.
 *
 * NEVER use string-based t('key') API in components.
 * ✅ import * as m from '$lib/i18n' → m.common_submit()
 * ❌ t('common.submit')
 *
 * DB content is loaded via $page.data:
 * ✅ {data.post.title}
 */

// Paraglide UI prefixes (NOT in DB)
export const PARAGLIDE_PREFIXES = [
  'common.', 'cookies.', 'nav.', 'auth.', 'error.', 'validation.',
  'theme.', 'footer.', 'sections.', 'legal.',
  'pricing.', 'setup.', 'init.', 'apiErrors.'
] as const

// DB content prefixes (NOT in Paraglide)
export const DB_PREFIXES = [
  'admin.', 'settings.', 'blog.', 'team.', 'portfolio.',
  'testimonials.', 'features.', 'faq.', 'clients.'
] as const

/**
 * Check if a translation key is a Paraglide (UI) key
 */
export function isParaglideKey(key: string): boolean {
  return PARAGLIDE_PREFIXES.some(prefix => key.startsWith(prefix))
}

/**
 * Check if a translation key is a DB (content) key
 */
export function isDbKey(key: string): boolean {
  return DB_PREFIXES.some(prefix => key.startsWith(prefix))
}
