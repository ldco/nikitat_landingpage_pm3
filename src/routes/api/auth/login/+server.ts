import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { verifyPassword } from '$lib/server/auth/password'
import { createSession } from '$lib/server/auth/session'
import { checkAccountLocked, recordFailedAttempt, resetFailedAttempts } from '$lib/server/auth/lockout'
import { createPendingVerification } from '$lib/server/auth/pending-2fa'
import { getEffectiveRole } from '$lib/server/services/users'
import { audit } from '$lib/server/audit'
import { getClientIp } from '$lib/server/security/rateLimit'
import { eq } from 'drizzle-orm'
import { FEATURES } from '$lib/config/site'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export async function POST(event: RequestEvent) {
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) error(400)

  const { email, password } = parsed.data
  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')

  const db = useDatabase()
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get()

  if (!user) {
    audit.loginFailed(ip, ua, email, 'user_not_found')
    error(401)
  }

  // Check lockout
  const lockStatus = checkAccountLocked(user.id)
  if (lockStatus.isLocked) {
    audit.loginFailed(ip, ua, email, 'account_locked', user.id)
    error(429)
  }

  // Verify password
  if (!verifyPassword(password, user.passwordHash)) {
    const result = recordFailedAttempt(user.id)
    audit.loginFailed(ip, ua, email, 'invalid_password', user.id)
    if (result.isLocked) {
      error(429)
    }
    error(401)
  }

  // Password OK — reset lockout
  resetFailedAttempts(user.id)

  // Two-factor challenge: password is verified but a session is only created
  // after the 2FA code is validated (PM v2 login flow parity).
  if (FEATURES.twoFactorAuth && user.twoFactorEnabled) {
    const token = createPendingVerification(user.id, user.email)
    event.cookies.set('pm-2fa-pending', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 10 * 60 // 10 minutes
    })
    return json({
      success: true,
      data: {
        requires2fa: true,
        // First-login hardening: the session is deferred until 2FA verifies,
        // but the client must know the account still needs a password change.
        mustChangePassword: user.mustChangePassword
      }
    })
  }

  const session = createSession(user.id)
  audit.login(ip, ua, user.id)

  event.cookies.set('pm-session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 // 24 hours
  })

  return json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: getEffectiveRole(user.id) ?? user.role },
      session: { id: session.id, expiresAt: session.expiresAt },
      mustChangePassword: user.mustChangePassword
    }
  })
}
