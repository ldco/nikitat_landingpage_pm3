/**
 * Security Headers
 *
 * The Content-Security-Policy header is owned by SvelteKit's built-in CSP
 * (svelte.config.js → kit.csp, mode 'nonce'): it generates a per-request
 * nonce, attaches it to the inline <script>/<style> blocks it emits, and
 * writes the header on page responses. hooks.server.ts must NOT override it
 * (an override would drop the nonce and break the app shell).
 *
 * This module provides the remaining static security headers for every
 * response (pages and API alike). The set is intentionally declarative —
 * a single record of constant values — so the full set is auditable at a
 * glance and statically verifiable by the pm3-validator. CSP (the
 * algorithm-heavy part) is delegated to SvelteKit; this module only composes
 * constant headers, which is why no library like helmet is required here.
 * See docs/architecture/security-headers.md for the decision record.
 */

export interface SecurityHeaders {
  'X-Content-Type-Options': 'nosniff'
  'X-Frame-Options': 'DENY'
  'X-XSS-Protection': '0'
  'Referrer-Policy': 'strict-origin-when-cross-origin'
  'Permissions-Policy': string
  'Strict-Transport-Security': string
  'Cross-Origin-Opener-Policy': 'same-origin'
  'Cross-Origin-Resource-Policy': 'same-origin'
}

const PRODUCTION_HSTS = 'max-age=63072000; includeSubDomains; preload'
const DEV_HSTS = 'max-age=0'

export const DEFAULT_SECURITY_HEADERS: Omit<SecurityHeaders, 'Strict-Transport-Security'> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

export function buildSecurityHeaders(isProduction: boolean): Headers {
  return new Headers({
    ...DEFAULT_SECURITY_HEADERS,
    'Strict-Transport-Security': isProduction ? PRODUCTION_HSTS : DEV_HSTS
  })
}
