import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { FEATURES } from '$lib/config/site'
import { requireAuth } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { verifyTotpCode } from '$lib/server/auth/totp'
import { getPendingSetup, clearPendingSetup } from '$lib/server/auth/pending-2fa'
import { twoFactorVerifyRateLimiter, getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'

const enableSchema = z.object({
  code: z.string().min(6).max(10)
})

/**
 * POST /api/user/2fa/enable
 * Verifies the TOTP code from a pending setup and enables 2FA for the user.
 */
export async function POST(event: RequestEvent) {
  if (!FEATURES.twoFactorAuth) {
    throw error(403, 'Two-factor authentication is not enabled for this project')
  }
  const user = requireAuth(event)

  if (!twoFactorVerifyRateLimiter.check(String(user.id))) {
    throw error(429, 'Too many verification attempts. Please try again later.')
  }

  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400, 'Invalid request')
  const parsed = enableSchema.safeParse(body)
  if (!parsed.success) throw error(400, 'Invalid verification code format')

  const pending = getPendingSetup(user.id)
  if (!pending) {
    throw error(400, 'No pending two-factor setup was found. Please start setup again.')
  }

  if (!verifyTotpCode(pending.secret, parsed.data.code, user.email)) {
    const ip = getClientIp(event)
    const ua = event.request.headers.get('user-agent')
    audit.twoFactorFailed(ip, ua, user.id, 'invalid_setup_code')
    throw error(400, 'Invalid verification code. Please try again.')
  }

  const db = useDatabase()
  const existing = db
    .select({ id: schema.user2fa.id })
    .from(schema.user2fa)
    .where(eq(schema.user2fa.userId, user.id))
    .get()

  if (existing) {
    db.update(schema.user2fa)
      .set({
        secret: pending.encryptedSecret,
        backupCodes: JSON.stringify(pending.backupCodes.hashed),
        backupCodesRemaining: pending.backupCodes.hashed.length,
        updatedAt: new Date()
      })
      .where(eq(schema.user2fa.userId, user.id))
      .run()
  } else {
    db.insert(schema.user2fa)
      .values({
        userId: user.id,
        secret: pending.encryptedSecret,
        backupCodes: JSON.stringify(pending.backupCodes.hashed),
        backupCodesRemaining: pending.backupCodes.hashed.length
      })
      .run()
  }

  db.update(schema.users)
    .set({ twoFactorEnabled: true, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))
    .run()

  clearPendingSetup(user.id)

  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')
  audit.twoFactorEnabled(ip, ua, user.id)

  return json({ success: true, data: { message: 'Two-factor authentication enabled' } })
}
