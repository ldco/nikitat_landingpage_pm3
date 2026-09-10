import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { createSubmission } from '$lib/server/services/contact'
import { getSetting } from '$lib/server/services/settings'
import { getRateLimiter, getClientIp } from '$lib/server/security/rateLimit'
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
  const ip = getClientIp(event)

  const limiter = await getRateLimiter('contact')
  if (!(await limiter.check(ip))) {
    error(429)
  }

  const body = await event.request.json().catch(() => null)
  if (!body) error(400)

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  }

  const { name, email, phone, subject, message, consent } = parsed.data

  // PM v2 parity: consent is required unless the admin's
  // forceShowFormWithoutLegalDocuments flag is on (in force mode the form has
  // no consent line — there is no legal text to consent to).
  const forceShowFormWithoutLegalDocuments = getSetting('contact.forceShowFormWithoutLegalDocuments') === 'true'
  if (!consent && !forceShowFormWithoutLegalDocuments) {
    error(400)
  }

  const inserted = createSubmission({ name, email, message, consent, phone, subject })

  logger.info({ email, subject }, 'Contact form submission received')

  if (FEATURES.contactTelegramNotify) {
    notifyNewContact({ submissionId: inserted.id, createdAt: inserted.createdAt }).catch((e: unknown) => {
      logger.error({ error: e instanceof Error ? e.message : e }, 'Telegram notification failed')
    })
  }

  if (FEATURES.contactEmailConfirmation) {
    sendContactConfirmation(email, name).catch((e: unknown) => {
      logger.error({ error: e instanceof Error ? e.message : e }, 'Confirmation email failed')
    })
  }

  return json({ success: true, data: { message: 'contact.messageSent' } })
}
