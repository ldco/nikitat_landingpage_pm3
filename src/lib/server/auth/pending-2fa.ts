/**
 * Pending 2FA State — in-memory ephemeral store (PM v2 ephemeral-store parity)
 *
 * Holds two kinds of transient state:
 *   - Pending setup: a fresh TOTP secret + backup codes awaiting code
 *     verification before being persisted (TTL 5 min).
 *   - Pending verification: a login that passed password check and now
 *     awaits the 2FA code before a session is created (TTL 10 min).
 *
 * Module-level Map, same pattern as rateLimit.ts / translations-cache.ts.
 * ⚠️ DEPLOY CONSTRAINT: state is process-local. Under PM2 cluster mode,
 * multiple replicas, or a restart within the TTL window, the verify/setup
 * request can land on a process without the token → user must re-login.
 * Only the default single-instance (adapter-node) deployment is fully
 * supported. For cluster deploys, move this store to shared storage (DB/Redis)
 * before rollout.
 */
import { randomBytes } from 'node:crypto'

export interface PendingSetup {
  userId: number
  secret: string
  encryptedSecret: string
  backupCodes: { plain: string[]; hashed: string[] }
  createdAt: number
}

export interface PendingVerification {
  token: string
  userId: number
  email: string
  /** True when the login requested "remember me" — the session created after
   * 2FA verification must use the long-lived TTL (30 days vs 24 hours). */
  rememberMe: boolean
  expiresAt: number
  attempts: number
}

const SETUP_TTL_MS = 5 * 60 * 1000
const VERIFY_TTL_MS = 10 * 60 * 1000
const MAX_VERIFY_ATTEMPTS = 5

// user-id → pending setup
const pendingSetups = new Map<number, PendingSetup>()
// token → pending verification
const pendingVerifications = new Map<string, PendingVerification>()

// Periodic cleanup of expired entries (every 5 min)
setInterval(() => {
  const now = Date.now()
  for (const [userId, setup] of pendingSetups) {
    if (now - setup.createdAt > SETUP_TTL_MS) pendingSetups.delete(userId)
  }
  for (const [token, verification] of pendingVerifications) {
    if (verification.expiresAt < now) pendingVerifications.delete(token)
  }
}, 5 * 60 * 1000).unref()

// ── Pending setup ───────────────────────────────────────────────────────────

export function setPendingSetup(setup: PendingSetup): void {
  pendingSetups.set(setup.userId, setup)
}

export function getPendingSetup(userId: number): PendingSetup | null {
  const setup = pendingSetups.get(userId)
  if (!setup) return null
  if (Date.now() - setup.createdAt > SETUP_TTL_MS) {
    pendingSetups.delete(userId)
    return null
  }
  return setup
}

export function clearPendingSetup(userId: number): void {
  pendingSetups.delete(userId)
}

// ── Pending verification (login) ───────────────────────────────────────────

export function createPendingVerification(userId: number, email: string, rememberMe = false): string {
  const token = randomBytes(32).toString('hex')
  pendingVerifications.set(token, {
    token,
    userId,
    email,
    rememberMe,
    expiresAt: Date.now() + VERIFY_TTL_MS,
    attempts: 0
  })
  return token
}

export function getPendingVerification(token: string): PendingVerification | null {
  const verification = pendingVerifications.get(token)
  if (!verification) return null
  if (verification.expiresAt < Date.now()) {
    pendingVerifications.delete(token)
    return null
  }
  return verification
}

export function incrementVerificationAttempts(token: string): number {
  const verification = pendingVerifications.get(token)
  if (!verification) return 0
  verification.attempts++
  if (verification.attempts >= MAX_VERIFY_ATTEMPTS) {
    pendingVerifications.delete(token)
  }
  return verification.attempts
}

export function clearPendingVerification(token: string): void {
  pendingVerifications.delete(token)
}

export const MAX_2FA_VERIFY_ATTEMPTS = MAX_VERIFY_ATTEMPTS
