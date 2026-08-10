import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * API contract tests (audit E-8 / N-11).
 *
 * Verifies the request-validation contracts used by the public contact
 * submission and login endpoints. The schemas mirror the route definitions
 * (src/routes/api/contact/submit/+server.ts, src/routes/api/auth/login/+server.ts);
 * keeping them in sync is asserted by the PM3 validator's check #9.
 */

// Mirror of the contact submission schema (src/routes/api/contact/submit/+server.ts)
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  consent: z.boolean()
})

// Mirror of the login schema (src/routes/api/auth/login/+server.ts)
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

describe('Contact submission contract', () => {
  it('accepts a valid submission with consent', () => {
    const r = contactSchema.safeParse({
      name: 'Ivan',
      email: 'ivan@example.com',
      message: 'Hello!',
      consent: true
    })
    expect(r.success).toBe(true)
  })

  it('accepts consent=false at the schema level (route enforces consent)', () => {
    const r = contactSchema.safeParse({
      name: 'Ivan',
      email: 'ivan@example.com',
      message: 'Hello!',
      consent: false
    })
    expect(r.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const r = contactSchema.safeParse({
      name: 'Ivan',
      email: 'not-an-email',
      message: 'Hello!',
      consent: true
    })
    expect(r.success).toBe(false)
  })

  it('rejects empty name and message', () => {
    const r = contactSchema.safeParse({
      name: '',
      email: 'ivan@example.com',
      message: '',
      consent: true
    })
    expect(r.success).toBe(false)
  })
})

describe('Login contract', () => {
  it('accepts valid credentials shape', () => {
    // zod v4's .email() requires a TLD of 2+ chars, so use example.com
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'x' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false)
  })

  it('rejects single-char TLD email (zod v4 email regex)', () => {
    // Documented zod v4 behavior: a@b.c fails the email format check.
    expect(loginSchema.safeParse({ email: 'a@b.c', password: 'x' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false)
  })
})
