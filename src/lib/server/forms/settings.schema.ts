/**
 * Settings Form Schema
 *
 * Shared between admin API and admin settings page.
 */
import { z } from 'zod'

export const settingsSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional().default('string'),
  group: z.string().optional()
})

export const bulkSettingsSchema = z.object({
  settings: z.array(settingsSchema)
})

export type SettingsSchema = z.infer<typeof settingsSchema>
export type BulkSettingsSchema = z.infer<typeof bulkSettingsSchema>
