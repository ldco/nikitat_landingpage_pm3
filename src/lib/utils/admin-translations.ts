import { z } from 'zod'

const tSchema = z.record(z.string(), z.string())

/**
 * Safely extract admin translations from SvelteKit page data.
 * No `as` casts — validates with Zod schema at the boundary.
 */
export function getAdminT(data: { t?: unknown }): Record<string, string> {
  const result = tSchema.safeParse(data.t)
  return result.success ? result.data : {}
}
