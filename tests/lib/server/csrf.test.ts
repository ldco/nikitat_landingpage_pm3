import { describe, it, expect } from 'vitest'
import {
  generateCsrfToken,
  validateCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_FIELD_NAME
} from '$lib/server/security/csrf'

/**
 * Security primitive unit tests — the double-submit CSRF contract in isolation.
 * Exercises the token generator and the timing-safe validator without the HTTP
 * hook: round-trip success, mismatch rejection, missing-token rejection, and
 * the export contract (cookie/header/field names are consumed by hooks.server.ts
 * and src/lib/api/client.ts, so a rename here breaks loudly).
 */

describe('csrf token generation', () => {
  it('produces a stable-length hex token per call', () => {
    const a = generateCsrfToken()
    const b = generateCsrfToken()
    expect(a).toBeTruthy()
    expect(b).toBeTruthy()
    expect(a).toHaveLength(64) // 32 random bytes -> hex
    expect(a).not.toBe(b) // every call is fresh
  })

  it('exposes the exact transport contract names', () => {
    expect(CSRF_COOKIE_NAME).toBe('pm-csrf')
    expect(CSRF_HEADER_NAME).toBe('x-csrf-token')
    expect(CSRF_FIELD_NAME).toBe('_csrf')
  })
})

describe('csrf token validation', () => {
  it('accepts a matching cookie + header pair', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token, token)).toBe(true)
  })

  it('rejects a mismatched header', () => {
    const token = generateCsrfToken()
    const other = generateCsrfToken()
    expect(validateCsrfToken(token, other)).toBe(false)
  })

  it('rejects when either side is missing', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(undefined, token)).toBe(false)
    expect(validateCsrfToken(token, undefined)).toBe(false)
    expect(validateCsrfToken(undefined, undefined)).toBe(false)
  })

  it('rejects on length mismatch without comparing', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token, 'short')).toBe(false)
    expect(validateCsrfToken(token, token + 'ff')).toBe(false)
  })

  it('rejects an empty-string token (guard against falsy bypass)', () => {
    const token = generateCsrfToken()
    expect(validateCsrfToken(token, '')).toBe(false)
    expect(validateCsrfToken('', '')).toBe(false)
  })

  it('is deterministic for equal values (timing-safe path)', () => {
    // The comparator is constant-time on equal-length buffers; equal values
    // must always pass, independent of call order.
    const token = generateCsrfToken()
    expect(validateCsrfToken(token, token)).toBe(true)
    expect(validateCsrfToken(token, token)).toBe(true)
  })
})
