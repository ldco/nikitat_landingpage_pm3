import { describe, it, expect } from 'vitest'
import {
  buildSecurityHeaders,
  DEFAULT_SECURITY_HEADERS
} from '$lib/server/security/headers'

/**
 * Security primitive unit tests — the static defense-in-depth header set.
 * CSP itself is owned by SvelteKit's nonce mode (svelte.config.js → kit.csp)
 * and is not asserted here; this covers the headers hooks.server.ts applies on
 * every response, including the production/development HSTS split.
 */

describe('security headers (production)', () => {
  const headers = buildSecurityHeaders(true)

  it('sends the full static defense-in-depth set', () => {
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('X-Frame-Options')).toBe('DENY')
    expect(headers.get('X-XSS-Protection')).toBe('0')
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
    expect(headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin')
  })

  it('sets a long-lived HSTS header in production (preload-ready)', () => {
    expect(headers.get('Strict-Transport-Security')).toBe(
      'max-age=63072000; includeSubDomains; preload'
    )
  })

  it('denies high-value browser features via Permissions-Policy', () => {
    const pp = headers.get('Permissions-Policy')
    expect(pp).toContain('camera=()')
    expect(pp).toContain('geolocation=()')
    expect(pp).toContain('microphone=()')
    // Commerce note: payment=() blocks the Payment Request API by default —
    // relax only if a shop intentionally uses it.
    expect(pp).toContain('payment=()')
  })
})

describe('security headers (development)', () => {
  it('disables HSTS in development (max-age=0)', () => {
    const headers = buildSecurityHeaders(false)
    expect(headers.get('Strict-Transport-Security')).toBe('max-age=0')
    // The rest of the set is identical in dev.
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('X-Frame-Options')).toBe('DENY')
  })
})

describe('default header contract', () => {
  it('matches the static defaults module (single source of truth)', () => {
    const headers = buildSecurityHeaders(false)
    for (const [key, value] of Object.entries(DEFAULT_SECURITY_HEADERS)) {
      expect(headers.get(key)).toBe(value)
    }
  })

  it('exposes headers as a Headers instance (ready for response.set)', () => {
    const headers = buildSecurityHeaders(false)
    expect(headers).toBeInstanceOf(Headers)
    expect(headers.get('X-Frame-Options')).toBe('DENY')
  })
})
