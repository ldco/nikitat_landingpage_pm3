/**
 * Contact Form Schema
 *
 * Shared between public API endpoint and admin contact page.
 */
import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'validation.nameTooShort').max(100),
  email: z.string().email('validation.invalidEmail'),
  message: z.string().min(10, 'validation.messageTooShort').max(5000),
  consent: z.boolean().refine(v => v === true, 'validation.consentRequired')
})

export type ContactSchema = z.infer<typeof contactSchema>
