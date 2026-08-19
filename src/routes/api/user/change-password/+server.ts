import { json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { verifyPassword, hashPassword, validatePassword, DEFAULT_PASSWORD_POLICY } from '$lib/server/auth/password'
import { createSession, deleteUserSessions, sessionCookieMaxAge } from '$lib/server/auth/session'
import { isPasswordBreached } from '$lib/server/utils/breach-check'
import { apiErrorResponse, requireAuth } from '$lib/server/utils/api'
import { audit } from '$lib/server/audit'
import { getClientIp, changePasswordRateLimiter } from '$lib/server/security/rateLimit'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
})

/**
 * PUT /api/user/change-password
 * Changes the current user's password after verifying the current one.
 * Errors are contract-format responses carrying i18n KEY codes (the client
 * translates them) instead of raw English literals with generic http.* codes.
 */
export async function PUT(event: RequestEvent) {
  const user = requireAuth(event)

  if (!changePasswordRateLimiter.check(String(user.id))) {
    return apiErrorResponse(429, 'apiErrors.auth.tooManyLoginAttempts', 'Too many attempts. Please try again later.')
  }

  const body = await event.request.json().catch(() => null)
  if (!body) return apiErrorResponse(400, 'apiErrors.auth.changePasswordInvalidInput', 'Invalid password change request')
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) return apiErrorResponse(400, 'apiErrors.auth.changePasswordInvalidInput', 'Invalid password change request')

  const { currentPassword, newPassword } = parsed.data

  const db = useDatabase()
  const row = db
    .select({ passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .get()

  if (!row) return apiErrorResponse(404, 'apiErrors.auth.authenticationRequired', 'User not found')

  if (!verifyPassword(currentPassword, row.passwordHash)) {
    return apiErrorResponse(401, 'apiErrors.auth.currentPasswordIncorrect', 'Current password is incorrect')
  }

  const policy = validatePassword(newPassword, DEFAULT_PASSWORD_POLICY)
  if (!policy.valid) {
    return apiErrorResponse(400, 'apiErrors.auth.passwordPolicyFailed', 'Password does not meet policy requirements')
  }

  // audit N-4: optional HIBP breach check (fail-open — never blocks on the API)
  const breached = await isPasswordBreached(newPassword)
  if (breached) {
    return apiErrorResponse(400, 'apiErrors.auth.passwordBreached', 'Password appears in known data breaches. Choose a different one.')
  }

  db.update(schema.users)
    .set({
      passwordHash: hashPassword(newPassword),
      // First-login hardening cleared: the operator replaced the bootstrap
      // credential, so normal admin access is now allowed.
      mustChangePassword: false,
      updatedAt: new Date()
    })
    .where(eq(schema.users.id, user.id))
    .run()

  // Revoke every existing session: a session minted with the old credential
  // must not stay privileged after the change (a forced bootstrap change
  // would otherwise leave earlier logins fully privileged). The current
  // browser gets a fresh session so the operator stays signed in; every
  // other device must re-authenticate with the new password.
  deleteUserSessions(user.id)

  const session = createSession(user.id)
  event.cookies.set('pm-session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: sessionCookieMaxAge(false)
  })

  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')
  audit.passwordChange(ip, ua, user.id, user.id)

  return json({ success: true, data: { message: 'Password changed successfully' } })
}
