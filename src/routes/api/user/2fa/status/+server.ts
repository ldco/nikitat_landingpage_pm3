import { json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { FEATURES } from '$lib/config/site'
import { requireAuth } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

/**
 * GET /api/user/2fa/status
 * Returns the current 2FA status for the authenticated user.
 */
export function GET(event: RequestEvent) {
  const user = requireAuth(event)

  if (!FEATURES.twoFactorAuth) {
    return json({ success: true, data: { enabled: false, available: false } })
  }

  const db = useDatabase()
  const row = db
    .select({ twoFactorEnabled: schema.users.twoFactorEnabled })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .get()

  if (!row) {
    return json({ success: true, data: { enabled: false, available: true } })
  }

  if (!row.twoFactorEnabled) {
    return json({ success: true, data: { enabled: false, available: true } })
  }

  const twofa = db
    .select({ backupCodesRemaining: schema.user2fa.backupCodesRemaining })
    .from(schema.user2fa)
    .where(eq(schema.user2fa.userId, user.id))
    .get()

  return json({
    success: true,
    data: {
      enabled: true,
      available: true,
      backupCodesRemaining: twofa?.backupCodesRemaining ?? 0
    }
  })
}
