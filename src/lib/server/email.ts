/**
 * Email Service (PM v2 server/utils/email.ts parity)
 *
 * Uses Nodemailer with SMTP for sending emails.
 * Configure via environment variables:
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { logger } from './utils/logger'
import { useEnv } from './utils/env'
import { DEFAULT_LOCALE } from '$lib/config/site'
import { getSanitizedContentTranslations } from '$lib/server/db/content-cache'

// Lazy-initialized transporter
let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (transporter) return transporter

  const env = useEnv()
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    logger.debug('SMTP not configured - emails will be skipped')
    return null
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ?? 465,
    secure: (SMTP_PORT ?? 465) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  })

  return transporter
}

export interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

/**
 * Send an email.
 * Returns true if sent, false if skipped (not configured) or failed.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transport = getTransporter()
  if (!transport) return false

  const env = useEnv()
  const from = env.SMTP_FROM ?? env.SMTP_USER

  try {
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    })
    logger.info({ to: options.to, subject: options.subject }, 'Email sent')
    return true
  } catch (e) {
    logger.error({ error: e instanceof Error ? e.message : e, to: options.to }, 'Failed to send email')
    return false
  }
}

/**
 * Send contact form confirmation to the user who submitted.
 *
 * The email copy is i18n-managed: strings resolve from the translations table
 * for the project's default locale (the DB is the runtime owner, seeded from
 * i18n/system-seed.json under `email.contactConfirmation.*`). The literals
 * below are the compile-time catalog fallbacks — identical to the seed
 * defaults — so an unseeded DB still sends readable copy.
 */
export async function sendContactConfirmation(
  to: string,
  name: string,
  siteName = 'Our Team'
): Promise<boolean> {
  const catalog = getSanitizedContentTranslations(DEFAULT_LOCALE)

  function text(key: string, fallback: string, params: Record<string, string>): string {
    let value = catalog[key] ?? fallback
    for (const [k, v] of Object.entries(params)) {
      value = value.replaceAll(`{${k}}`, v)
    }
    return value
  }

  const subject = text(
    'email.contactConfirmation.subject',
    'We received your message - {siteName}',
    { siteName }
  )
  const body = text(
    'email.contactConfirmation.body',
    'Hi {name},\n\nThank you for contacting us! We have received your message and will get back to you as soon as possible.\n\nBest regards,\n{siteName}',
    { name, siteName }
  )
  const heading = text(
    'email.contactConfirmation.htmlHeading',
    'Thank you for reaching out!',
    {}
  )
  const htmlBody = text(
    'email.contactConfirmation.htmlBody',
    'We have received your message and will get back to you as soon as possible.',
    {}
  )

  return sendEmail({
    to,
    subject,
    text: body,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${heading}</h2>
        <p>Hi ${name},</p>
        <p>${htmlBody}</p>
        <p>Best regards,<br/><strong>${siteName}</strong></p>
      </div>
    `
  })
}
