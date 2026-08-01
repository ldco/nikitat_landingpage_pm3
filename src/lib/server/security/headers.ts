/**
 * Security Headers
 *
 * CSP + other security headers for every response.
 * CSP uses nonce for inline scripts.
 */
import { randomBytes } from 'node:crypto'

export interface SecurityHeaders {
  'Content-Security-Policy': string
  'X-Content-Type-Options': 'nosniff'
  'X-Frame-Options': 'DENY'
  'X-XSS-Protection': '0'
  'Referrer-Policy': 'strict-origin-when-cross-origin'
  'Permissions-Policy': string
  'Strict-Transport-Security': string
}

export function generateCspNonce(): string {
  return randomBytes(16).toString('base64')
}

export function buildSecurityHeaders(nonce: string, isProduction: boolean): Headers {
  // Only enable CSP in production (nonce injection via event.locals.nonce is not
  // working in current SvelteKit version — without nonce on <script> tags,
  // the CSP blocks all JS, making the page non-interactive).
  const csp = isProduction
    ? [
        `default-src 'self'`,
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        `style-src 'self' 'unsafe-inline'`,
        `img-src 'self' data: blob: https:`,
        `font-src 'self' data:`,
        `connect-src 'self' https:`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`
      ].join('; ')
    : [
        `default-src 'self'`,
        `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
        `style-src 'self' 'unsafe-inline'`,
        `img-src 'self' data: blob: https:`,
        `font-src 'self' data:`,
        `connect-src 'self' https:`,
        `frame-ancestors 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`
      ].join('; ')

  const headers = new Headers({
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '0',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': isProduction ? 'max-age=63072000; includeSubDomains' : 'max-age=0'
  })

  return headers
}
