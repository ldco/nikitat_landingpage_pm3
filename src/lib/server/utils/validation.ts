/**
 * Common Zod Validation Schemas
 */
import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address').max(255)

export const slugSchema = z.string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')

export const urlSchema = z.string().url('Invalid URL').max(2048).optional().or(z.literal(''))

export const localeSchema = z.enum(['ru', 'en', 'fr', 'he'])

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
})

/** Path param id for `[id]` routes — rejects non-numeric ids with a 400. */
export const idParamSchema = z.coerce.number().int().positive()

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128)
