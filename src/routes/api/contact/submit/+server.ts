import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { contactRateLimiter, getClientIp } from '$lib/server/security/rateLimit'
import { logger } from '$lib/server/utils/logger'
import { FEATURES } from '$lib/config/site'
import { notifyNewContact } from '$lib/server/telegram'
import { sendContactConfirmation } from '$lib/server/email'

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
  const inserted = db.insert(schema.contactSubmissions).values({
    name,
    email,
    phone: phone || null,
    subject: subject || null,
    message,
    consent: true
  }).returning({ id: schema.contactSubmissions.id, createdAt: schema.contactSubmissions.createdAt }).get()

  logger.info({ email, subject }, 'Contact form submission received')

  // Notify admin via Telegram (fire-and-forget, gated by feature flag)
  if (FEATURES.contactTelegramNotify) {
    notifyNewContact({ submissionId: inserted.id, createdAt: inserted.createdAt }).catch((e: unknown) => {
      logger.error({ error: e instanceof Error ? e.message : e }, 'Telegram notification failed')
    })
  }

  // Send confirmation email to the submitter (gated by feature flag)
  if (FEATURES.contactEmailConfirmation) {
    sendContactConfirmation(email, name).catch((e: unknown) => {
      logger.error({ error: e instanceof Error ? e.message : e }, 'Confirmation email failed')
    })
  }

  return json({ success: true, data: { message: 'Message sent successfully' } })
}
