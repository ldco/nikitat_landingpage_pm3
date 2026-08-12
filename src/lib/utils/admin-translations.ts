import { z } from 'zod'
import { t as unifiedT } from '$lib/stores/content.svelte'

const tSchema = z.record(z.string(), z.string())

/**
 * Safely extract admin translations from SvelteKit page data, with fallback.
 *
 * DB translations (data.t) take precedence. For keys missing from the DB, the
 * unified `t()` helper falls back through the Paraglide catalog — so admin
 * pages never show raw i18n keys when a locale lacks seeded DB translations.
 */
export function getAdminT(data: { t?: unknown }): Record<string, string> {
  const result = tSchema.safeParse(data.t)
  const dbTranslations = result.success ? result.data : {}

  return new Proxy(dbTranslations, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined
      if (prop in target) return target[prop]
      return unifiedT(prop)
    },
    has(target, prop) {
      return typeof prop === 'string' && prop in target
    }
  })
}
