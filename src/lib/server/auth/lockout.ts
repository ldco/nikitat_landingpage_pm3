/**
 * Account Lockout Utility
 *
 * Account-level brute force protection.
 * - 5 failed attempts → 30 min lockout
 * - Attempts reset after 1 hour of no failures
 */
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30 * 60 * 1000
const ATTEMPT_RESET_MS = 60 * 60 * 1000

export interface LockoutStatus {
  isLocked: boolean
  lockedUntil: Date | null
  attemptsRemaining: number
  minutesRemaining: number
}

export function checkAccountLocked(userId: number): LockoutStatus {
  const db = useDatabase()

  const user = db
    .select({
      failedLoginAttempts: schema.users.failedLoginAttempts,
      lockedUntil: schema.users.lockedUntil,
      lastFailedLogin: schema.users.lastFailedLogin
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get()

  if (!user) {
    return { isLocked: false, lockedUntil: null, attemptsRemaining: MAX_FAILED_ATTEMPTS, minutesRemaining: 0 }
  }

  const now = new Date()

  if (user.lockedUntil && now < user.lockedUntil) {
    const minutesRemaining = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000)
    return { isLocked: true, lockedUntil: user.lockedUntil, attemptsRemaining: 0, minutesRemaining }
  }

  if (user.lockedUntil && now >= user.lockedUntil) {
    resetFailedAttempts(userId)
    return { isLocked: false, lockedUntil: null, attemptsRemaining: MAX_FAILED_ATTEMPTS, minutesRemaining: 0 }
  }

  if (user.lastFailedLogin) {
    const timeSinceLastFailure = now.getTime() - user.lastFailedLogin.getTime()
    if (timeSinceLastFailure > ATTEMPT_RESET_MS) {
      resetFailedAttempts(userId)
      return { isLocked: false, lockedUntil: null, attemptsRemaining: MAX_FAILED_ATTEMPTS, minutesRemaining: 0 }
    }
  }

  const attempts = user.failedLoginAttempts || 0
  return { isLocked: false, lockedUntil: null, attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - attempts), minutesRemaining: 0 }
}

export function recordFailedAttempt(userId: number): { isLocked: boolean; attemptsRemaining: number; lockoutMinutes: number } {
  const db = useDatabase()

  const user = db
    .select({
      failedLoginAttempts: schema.users.failedLoginAttempts,
      lastFailedLogin: schema.users.lastFailedLogin
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get()

  if (!user) {
    return { isLocked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS, lockoutMinutes: 0 }
  }

  const now = new Date()
  let currentAttempts = user.failedLoginAttempts || 0

  if (user.lastFailedLogin) {
    const timeSinceLastFailure = now.getTime() - user.lastFailedLogin.getTime()
    if (timeSinceLastFailure > ATTEMPT_RESET_MS) {
      currentAttempts = 0
    }
  }

  const newAttempts = currentAttempts + 1
  const updateData: Record<string, unknown> = {
    failedLoginAttempts: newAttempts,
    lastFailedLogin: now
  }

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    updateData.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS)
  }

  db.update(schema.users).set(updateData).where(eq(schema.users.id, userId)).run()

  const isLocked = newAttempts >= MAX_FAILED_ATTEMPTS
  return {
    isLocked,
    attemptsRemaining: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts),
    lockoutMinutes: isLocked ? Math.ceil(LOCKOUT_DURATION_MS / 60000) : 0
  }
}

export function resetFailedAttempts(userId: number): void {
  const db = useDatabase()
  db.update(schema.users)
    .set({ failedLoginAttempts: 0, lockedUntil: null, lastFailedLogin: null })
    .where(eq(schema.users.id, userId))
    .run()
}

export function getLockoutConfig() {
  return {
    maxFailedAttempts: MAX_FAILED_ATTEMPTS,
    lockoutDurationMinutes: LOCKOUT_DURATION_MS / 60000,
    attemptResetHours: ATTEMPT_RESET_MS / 3600000
  }
}
