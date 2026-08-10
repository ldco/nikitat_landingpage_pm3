import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { verifyPassword, hashPassword, validatePassword, DEFAULT_PASSWORD_POLICY } from '$lib/server/auth/password'
import { isPasswordBreached } from '$lib/server/utils/breach-check'
import { requireAuth } from '$lib/server/utils/api'
import { audit } from '$lib/server/audit'
import { getClientIp, changePasswordRateLimiter } from '$lib/server/security/rateLimit'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
})

/**
 * PUT /api/user/change-password
 * Changes the current user's password after verifying the current one.
 */
export async function PUT(event: RequestEvent) {
  const user = requireAuth(event)

  if (!changePasswordRateLimiter.check(String(user.id))) {
    throw error(429, 'Too many attempts. Please try again later.')
  }

  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400, 'Invalid password change request')
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) throw error(400, 'Invalid password change request')

  const { currentPassword, newPassword } = parsed.data

  const db = useDatabase()
  const row = db
    .select({ passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .get()

  if (!row) throw error(404, 'User not found')

  if (!verifyPassword(currentPassword, row.passwordHash)) {
    throw error(401, 'Current password is incorrect')
  }

  const policy = validatePassword(newPassword, DEFAULT_PASSWORD_POLICY)
  if (!policy.valid) {
    throw error(400, 'Password does not meet policy requirements')
  }

  // audit N-4: optional HIBP breach check (fail-open — never blocks on the API)
  const breached = await isPasswordBreached(newPassword)
  if (breached) {
    throw error(400, 'Password appears in known data breaches. Choose a different one.')
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

  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')
  audit.passwordChange(ip, ua, user.id, user.id)

  return json({ success: true, data: { message: 'Password changed successfully' } })
}
