/**
 * CSRF Protection — Double-Submit Cookie Pattern
 *
 * Token stored in HTTP-only cookie, must be echoed in X-CSRF-Token header.
 * Timing-safe comparison to prevent timing attacks.
 */
import { randomBytes, timingSafeEqual } from 'node:crypto'

export const CSRF_COOKIE_NAME = 'pm-csrf'
export const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

export function generateCsrfToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex')
}

export function validateCsrfToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) return false
  if (cookieToken.length !== headerToken.length) return false

  try {
    return timingSafeEqual(Buffer.from(cookieToken, 'utf8'), Buffer.from(headerToken, 'utf8'))
  } catch {
    return false
  }
}
