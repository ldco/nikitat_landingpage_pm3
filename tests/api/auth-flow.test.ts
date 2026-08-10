import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hashPassword, verifyPassword, generateSecurePassword, validatePassword, generateSessionId } from '$lib/server/auth/password'

/**
 * API integration tests (audit E-8 / N-11).
 *
 * Password hashing/verification (scrypt + timingSafeEqual), password policy,
 * session-id generation, and account lockout (5 fails → 30 min). Lockout is
 * tested against a mocked drizzle store; the lockout logic itself (threshold,
 * reset) is real.
 */

// Mock the db module so lockout tests are hermetic (no real SQLite file).
vi.mock('$lib/server/db', async (importOriginal) => {
  const original = await importOriginal<typeof import('$lib/server/db')>()
  const state = new Map<number, { failed: number; lockedUntil: number | null; lastFailed: number | null }>()

  const update = (_id: number, data: Record<string, unknown>) => {
    const s = state.get(_id) ?? { failed: 0, lockedUntil: null, lastFailed: null }
    if ('failedLoginAttempts' in data) s.failed = data.failedLoginAttempts as number
    if ('lockedUntil' in data) s.lockedUntil = data.lockedUntil ? (data.lockedUntil as Date).getTime() : null
    if ('lastFailedLogin' in data) s.lastFailed = data.lastFailed ? (data.lastFailed as Date).getTime() : null
    state.set(_id, s)
  }

  return {
    useDatabase: () => ({
      select: () => ({
        from: () => ({
          where: () => ({
            get: () => {
              // return the row shape the lockout module expects
              return {
                failedLoginAttempts: state.get(1)?.failed ?? 0,
                lockedUntil: state.get(1)?.lockedUntil ? new Date(state.get(1)!.lockedUntil) : null,
                lastFailedLogin: state.get(1)?.lastFailed ? new Date(state.get(1)!.lastFailed) : null
              }
            }
          })
        })
      }),
      update: (_t: unknown) => ({
        set: (data: Record<string, unknown>) => ({
          where: () => ({ run: () => update(1, data) })
        })
      })
    }),
    __reset: () => state.clear(),
    schema: original.schema
  }
})

// Re-import after mock so lockout uses the mocked db
import { checkAccountLocked, recordFailedAttempt, resetFailedAttempts, getLockoutConfig } from '$lib/server/auth/lockout'

describe('Auth flow: password hashing', () => {
  it('hashes and verifies a correct password', () => {
    const hash = hashPassword('S3cure!Passw0rd')
    expect(hash).not.toContain('S3cure!Passw0rd')
    expect(verifyPassword('S3cure!Passw0rd', hash)).toBe(true)
  })

  it('rejects a wrong password (timingSafeEqual path)', () => {
    const hash = hashPassword('S3cure!Passw0rd')
    expect(verifyPassword('WrongPass123!', hash)).toBe(false)
  })

  it('generates unique session ids', () => {
    expect(generateSessionId()).not.toBe(generateSessionId())
    expect(generateSessionId().length).toBeGreaterThanOrEqual(32)
  })
})

describe('Auth flow: password policy', () => {
  it('accepts a strong password', () => {
    expect(validatePassword('Str0ng!Passw0rd123').valid).toBe(true)
  })

  it('rejects common passwords', () => {
    expect(validatePassword('password123').valid).toBe(false)
  })

  it('rejects weak passwords (no uppercase/digit/special)', () => {
    expect(validatePassword('alllowercase').valid).toBe(false)
  })

  it('generates secure random passwords that pass policy', () => {
    const p = generateSecurePassword()
    expect(validatePassword(p).valid).toBe(true)
  })
})

describe('Auth flow: account lockout (mocked store)', () => {
  beforeEach(() => {
    resetFailedAttempts(1)
  })

  it('locks after the configured number of failed attempts', () => {
    for (let i = 0; i < getLockoutConfig().maxFailedAttempts; i++) {
      recordFailedAttempt(1)
    }
    const status = checkAccountLocked(1)
    expect(status.isLocked).toBe(true)
    expect(status.minutesRemaining).toBeGreaterThan(0)
  })

  it('allows attempts below the threshold', () => {
    recordFailedAttempt(1)
    expect(checkAccountLocked(1).isLocked).toBe(false)
  })

  it('resets after successful login', () => {
    for (let i = 0; i < getLockoutConfig().maxFailedAttempts; i++) recordFailedAttempt(1)
    resetFailedAttempts(1)
    expect(checkAccountLocked(1).isLocked).toBe(false)
  })
})
