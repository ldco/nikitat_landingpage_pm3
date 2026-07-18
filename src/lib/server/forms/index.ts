/**
 * Forms — Barrel export
 *
 * Shared Zod schemas between API endpoints and form pages.
 * Single source of truth — never duplicate validation logic.
 */
export { loginSchema } from './login.schema'
export type { LoginSchema } from './login.schema'

export { contactSchema } from './contact.schema'
export type { ContactSchema } from './contact.schema'

export { createUserSchema, updateUserSchema } from './user.schema'
export type { CreateUserSchema, UpdateUserSchema } from './user.schema'

export { settingsSchema, bulkSettingsSchema } from './settings.schema'
export type { SettingsSchema, BulkSettingsSchema } from './settings.schema'
