import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { FEATURES } from '$lib/config/site'
import { requireAuth } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '$lib/server/auth/password'
import { twoFactorVerifyRateLimiter, getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const disableSchema = z.object({
  password: z.string().min(1)
})

/**
 * POST /api/user/2fa/disable
 * Disables 2FA after password confirmation.
 */
export async function POST(event: RequestEvent) {
  if (!FEATURES.twoFactorAuth) {
    throw error(403, 'Two-factor authentication is not enabled for this project')
  }
  const user = requireAuth(event)

  if (!twoFactorVerifyRateLimiter.check(String(user.id))) {
    throw error(429, 'Too many attempts. Please try again later.')
  }

  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400, 'Invalid request')
  const parsed = disableSchema.safeParse(body)
  if (!parsed.success) throw error(400, 'Password is required')

  const db = useDatabase()
  const row = db
    .select({ passwordHash: schema.users.passwordHash, twoFactorEnabled: schema.users.twoFactorEnabled })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .get()

  if (!row) throw error(404, 'User not found')
  if (!row.twoFactorEnabled) {
    throw error(400, 'Two-factor authentication is not enabled')
  }
  if (!verifyPassword(parsed.data.password, row.passwordHash)) {
    throw error(401, 'Incorrect password')
  }

  db.delete(schema.user2fa).where(eq(schema.user2fa.userId, user.id)).run()
  db.update(schema.users)
    .set({ twoFactorEnabled: false, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))
    .run()

  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')
  audit.twoFactorDisabled(ip, ua, user.id, user.id, 'User disabled 2FA')

  return json({ success: true, data: { message: 'Two-factor authentication disabled' } })
}
