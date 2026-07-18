/**
 * Telegram Bot Service
 *
 * Sends notifications to a Telegram chat/group.
 * Configure via:
 * - Admin settings: contact.telegramBotToken
 * - Admin settings: contact.telegramChatId
 */
import { setDefaultResultOrder } from 'node:dns'
import { logger } from './logger'
import { getSettingValue } from './site-settings'

// Some deployment hosts resolve api.telegram.org to IPv6 first even when IPv6
// egress is broken. Prefer IPv4 so notifications do not silently stall.
setDefaultResultOrder('ipv4first')

interface TelegramConfig {
  botToken: string
  chatId: string
}

const TELEGRAM_BOT_TOKEN_PATTERN = /^\d{6,}:[A-Za-z0-9_-]{20,}$/

function formatTelegramDate(value: Date | string | number | null | undefined): string {
  const date =
    value instanceof Date
      ? value
      : value
        ? new Date(value)
        : new Date()
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value || '00'

  return `${getPart('day')}.${getPart('month')}.${getPart('year')} ${getPart('hour')}:${getPart('minute')}`
}

function normalizeTelegramBotToken(value: string): string {
  const trimmed = value.trim()
  if (/^bot\d{6,}:/i.test(trimmed)) {
    return trimmed.slice(3)
  }

  return trimmed
}

function getConfig(): TelegramConfig | null {
  const telegramBotToken = normalizeTelegramBotToken(getSettingValue('contact.telegramBotToken') || '')
  const telegramChatId = (getSettingValue('contact.telegramChatId') || '').trim()

  if (!telegramBotToken || !telegramChatId) {
    logger.debug('Telegram bot not configured - notifications will be skipped')
    return null
  }

  if (!TELEGRAM_BOT_TOKEN_PATTERN.test(telegramBotToken)) {
    logger.error(
      {
        tokenLength: telegramBotToken.length,
        hasSeparator: telegramBotToken.includes(':'),
        startsWithHttp: /^https?:\/\//i.test(telegramBotToken)
      },
      'Telegram bot token has invalid format - expected BotFather token like 123456789:ABC...'
    )
    return null
  }

  return {
    botToken: telegramBotToken,
    chatId: telegramChatId
  }
}

/**
 * Send a message to the configured Telegram chat
 * Supports HTML formatting
 */
export async function sendTelegramMessage(
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<boolean> {
  const config = getConfig()
  if (!config) return false

  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: parseMode
      })
    })

    const result = await response.json()

    if (!result.ok) {
      logger.error({ description: result.description }, 'Telegram API error')
      return false
    }

    logger.info('Telegram message sent successfully')
    return true
  } catch (error) {
    logger.error({ error }, 'Failed to send Telegram message')
    return false
  }
}

/**
 * Send a metadata-only contact form notification to admin.
 *
 * Do not include name, reply-to contact, phone, subject, or message body here:
 * Telegram is an external channel, while the contact submission stored in the
 * local database/admin panel is the canonical private record.
 */
export async function notifyNewContact(data: {
  submissionId: number
  createdAt?: Date | string | number | null
}): Promise<boolean> {
  const receivedAt = formatTelegramDate(data.createdAt)
  const text = `
📩 <b>New Contact Form Submission</b>

<b>Submission ID:</b> #${data.submissionId}
<b>Received:</b> ${receivedAt}

Personal data was not sent to Telegram.
Open the admin contact inbox to review the full submission.
`.trim()

  return sendTelegramMessage(text)
}
