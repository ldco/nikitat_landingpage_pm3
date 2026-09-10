import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { FEATURES } from '$lib/config/site'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { verify2faCode } from '$lib/server/auth/totp'
import { createSession, sessionCookieMaxAge, REMEMBER_ME_TTL_MS } from '$lib/server/auth/session'
import {
  getPendingVerification,
  clearPendingVerification,
  incrementVerificationAttempts,
  MAX_2FA_VERIFY_ATTEMPTS
} from '$lib/server/auth/pending-2fa'
import { getRateLimiter, getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const PENDING_COOKIE = 'pm-2fa-pending'
const SESSION_COOKIE = 'pm-session'

const verifySchema = z.object({
  code: z.string().min(6).max(10)
})

/**
 * POST /api/user/2fa/verify
 * Verifies a TOTP or backup code during login (after password verification)
 * and creates the session. Mirrors PM v2 /api/user/2fa/verify.
 */
export async function POST(event: RequestEvent) {
  if (!FEATURES.twoFactorAuth) {
    throw error(403, 'Two-factor authentication is not enabled for this project')
  }

  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')

  const pendingToken = event.cookies.get(PENDING_COOKIE)
  if (!pendingToken) {
    throw error(400, 'No pending two-factor verification. Please log in again.')
  }

  // Key the limiter on the unguessable per-login token (not just IP, which is
  // client-controllable via X-Forwarded-For). Each login mints a fresh token,
  // so rotating IPs cannot defeat the attempt budget.
  const twoFactorLimiter = await getRateLimiter('2fa-verify')
  if (!(await twoFactorLimiter.check(pendingToken))) {
    throw error(429, 'Too many verification attempts. Please try again later.')
  }

  const pending = getPendingVerification(pendingToken)
  if (!pending) {
    event.cookies.delete(PENDING_COOKIE, { path: '/' })
    throw error(400, 'Verification session expired. Please log in again.')
  }

  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400, 'Invalid request')
  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) throw error(400, 'Invalid verification code format')

  const db = useDatabase()

  // Read + verify + consume backup codes atomically so a double-submitted
  // backup code can only succeed once (compare-and-remove inside a transaction).
  const { user2fa, result, hashedBackupCodes } = db.transaction(() => {
    const row = db
      .select()
      .from(schema.user2fa)
      .where(eq(schema.user2fa.userId, pending.userId))
      .get()

    if (!row) {
      return { user2fa: null, result: null, hashedBackupCodes: [] }
    }

    const codes: string[] = JSON.parse(row.backupCodes) as string[]
    const verify = verify2faCode(parsed.data.code, row.secret, codes, pending.email)

    if (verify.success && verify.method === 'backup' && verify.backupCodeIndex !== undefined) {
      codes.splice(verify.backupCodeIndex, 1)
      db.update(schema.user2fa)
        .set({
          backupCodes: JSON.stringify(codes),
          backupCodesRemaining: codes.length,
          updatedAt: new Date()
        })
        .where(eq(schema.user2fa.userId, pending.userId))
        .run()
    }

    return { user2fa: row, result: verify, hashedBackupCodes: codes }
  })

  // 2FA disabled between login and verification — restart the flow.
  if (!user2fa) {
    clearPendingVerification(pendingToken)
    event.cookies.delete(PENDING_COOKIE, { path: '/' })
    throw error(400, 'Two-factor authentication is no longer enabled. Please log in again.')
  }

  if (!result || !result.success) {
    const attempts = incrementVerificationAttempts(pendingToken)
    audit.twoFactorFailed(ip, ua, pending.userId, 'invalid_code')
    if (attempts >= MAX_2FA_VERIFY_ATTEMPTS) {
      event.cookies.delete(PENDING_COOKIE, { path: '/' })
      throw error(429, 'Too many failed attempts. Please log in again.')
    }
    throw error(401, 'Invalid verification code. Please try again.')
  }

  // Session fixation prevention: remove any pre-existing session
  const oldSessionId = event.cookies.get(SESSION_COOKIE)
  if (oldSessionId) {
    db.delete(schema.sessions).where(eq(schema.sessions.id, oldSessionId)).run()
  }

  // "Remember me" (chosen at the login form, carried in the pending token)
  // extends the session lifetime to 30 days; otherwise the default 24 hours.
  const session = createSession(pending.userId, pending.rememberMe ? REMEMBER_ME_TTL_MS : undefined)
  clearPendingVerification(pendingToken)
  event.cookies.delete(PENDING_COOKIE, { path: '/' })

  event.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: sessionCookieMaxAge(pending.rememberMe)
  })

  audit.twoFactorVerified(ip, ua, pending.userId, result.method ?? 'totp')
  audit.login(ip, ua, pending.userId)

  const user = db
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role, mustChangePassword: schema.users.mustChangePassword })
    .from(schema.users)
    .where(eq(schema.users.id, pending.userId))
    .get()

  return json({
    success: true,
    data: {
      user: user
        ? { id: user.id, email: user.email, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword }
        : { id: pending.userId, email: pending.email, name: null, role: 'editor', mustChangePassword: true },
      backupCodesRemaining: result.method === 'backup' ? hashedBackupCodes.length : undefined
    }
  })
}
