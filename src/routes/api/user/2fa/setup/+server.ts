import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { FEATURES } from '$lib/config/site'
import { requireAuth } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { generateTotpSecret, generateTotpQRCode, getTotpUri, encryptTotpSecret, generateBackupCodes } from '$lib/server/auth/totp'
import { getRateLimiter } from '$lib/server/security/rateLimit'
import { setPendingSetup } from '$lib/server/auth/pending-2fa'

// Rule C.10: mutations validate input with Zod. Setup carries no payload —
// accept an empty/absent body and reject anything unexpected.
const setupBodySchema = z.object({}).optional()

/**
 * POST /api/user/2fa/setup
 * Generates a new TOTP secret + backup codes and stores a pending setup.
 * Does NOT enable 2FA — the user must verify a code via /api/user/2fa/enable.
 */
export async function POST(event: RequestEvent) {
  if (!FEATURES.twoFactorAuth) {
    throw error(403, 'Two-factor authentication is not enabled for this project')
  }
  const user = requireAuth(event)

  const body = await event.request.json().catch(() => undefined)
  const parsed = setupBodySchema.safeParse(body)
  if (!parsed.success) throw error(400, 'Unexpected body')

  const setupLimiter = await getRateLimiter('2fa-setup')
  if (!(await setupLimiter.check(String(user.id)))) {
    throw error(429, 'Too many setup attempts. Please try again later.')
  }

  const db = useDatabase()
  const row = db
    .select({ twoFactorEnabled: schema.users.twoFactorEnabled })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .get()

  if (!row) throw error(404, 'User not found')
  if (row.twoFactorEnabled) {
    throw error(400, 'Two-factor authentication is already enabled')
  }

  const secret = generateTotpSecret()
  const encryptedSecret = encryptTotpSecret(secret)
  const backupCodes = generateBackupCodes()
  const qrCode = await generateTotpQRCode(secret, user.email)
  const uri = getTotpUri(secret, user.email)

  setPendingSetup({
    userId: user.id,
    secret,
    encryptedSecret,
    backupCodes,
    createdAt: Date.now()
  })

  return json({
    success: true,
    data: {
      qrCode,
      uri,
      backupCodes: backupCodes.plain
    }
  })
}
