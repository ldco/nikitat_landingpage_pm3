import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { contactRateLimiter, getClientIp } from '$lib/server/security/rateLimit'
import { logger } from '$lib/server/utils/logger'

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
  consent: z.boolean()
})

export async function POST(event: RequestEvent) {
  const ip = getClientIp(event.request)

  if (!contactRateLimiter.check(ip)) {
    error(429)
  }

  const body = await event.request.json().catch(() => null)
  if (!body) error(400)

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  }

  const { name, email, phone, subject, message, consent } = parsed.data

  if (!consent) {
    error(400)
  }

  const db = useDatabase()
  db.insert(schema.contactSubmissions).values({
    name,
    email,
    phone: phone || null,
    subject: subject || null,
    message,
    consent: true
  }).run()

  logger.info({ email, subject }, 'Contact form submission received')

  return json({ success: true, data: { message: 'Message sent successfully' } })
}
