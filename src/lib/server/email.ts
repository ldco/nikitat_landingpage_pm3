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
 */
export async function sendContactConfirmation(
  to: string,
  name: string,
  siteName = 'Our Team'
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `We received your message - ${siteName}`,
    text: `Hi ${name},\n\nThank you for contacting us! We have received your message and will get back to you as soon as possible.\n\nBest regards,\n${siteName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for reaching out!</h2>
        <p>Hi ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Best regards,<br/><strong>${siteName}</strong></p>
      </div>
    `
  })
}
