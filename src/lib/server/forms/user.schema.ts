/**
 * User Form Schema
 *
 * Shared between admin API and admin page.
 */
import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('validation.invalidEmail'),
  password: z.string().min(8, 'validation.passwordTooShort').max(128),
  name: z.string().min(1, 'validation.nameRequired').max(100),
  role: z.enum(['master', 'admin', 'editor']).optional().default('editor')
})

export const updateUserSchema = z.object({
  email: z.string().email('validation.invalidEmail').optional(),
  password: z.string().min(8, 'validation.passwordTooShort').max(128).optional(),
  name: z.string().min(1, 'validation.nameRequired').max(100).optional(),
  role: z.enum(['master', 'admin', 'editor']).optional()
})

export type CreateUserSchema = z.infer<typeof createUserSchema>
export type UpdateUserSchema = z.infer<typeof updateUserSchema>
