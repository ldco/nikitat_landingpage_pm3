/**
 * Login Form Schema
 *
 * Shared between API endpoint and admin login page.
 */
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('auth.errorInvalidEmail'),
  password: z.string().min(6, 'auth.errorPasswordTooShort').max(128)
})

export type LoginSchema = z.infer<typeof loginSchema>
