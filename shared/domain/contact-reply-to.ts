export const CONTACT_REPLY_TO_MAX_LENGTH = 255

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEGRAM_HANDLE_REGEX = /^@[A-Za-z0-9_]{5,32}$/

export function normalizeContactReplyTo(value: string): string {
  return value.trim()
}

export function isValidEmailAddress(value: string): boolean {
  return EMAIL_REGEX.test(normalizeContactReplyTo(value))
}

export function isValidTelegramHandle(value: string): boolean {
  return TELEGRAM_HANDLE_REGEX.test(normalizeContactReplyTo(value))
}

export function isValidContactReplyTo(value: string): boolean {
  const normalized = normalizeContactReplyTo(value)

  return isValidEmailAddress(normalized) || isValidTelegramHandle(normalized)
}
