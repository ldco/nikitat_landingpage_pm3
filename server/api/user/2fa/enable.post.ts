/**
 * 2FA Enable Endpoint
 *
 * POST /api/user/2fa/enable
 * Body: { code: string }
 * Verifies the TOTP code and enables 2FA for the user.
 *
 * Returns: { success: true, code: string }
 *
 * Security:
 * - Requires authenticated session
 * - Requires pending setup from /setup endpoint
 * - Verifies TOTP code before enabling
 * - Rate limited: 5 attempts per 15 minutes
 * - Uses distributed ephemeral store for cross-process safety
 */
import { eq } from 'drizzle-orm'
import { useDatabase, schema } from '../../../database/client'
import { verifyTotpCode } from '../../../utils/totp'
import { twoFactorEnableSchema } from '../../../utils/validation'
import { audit } from '../../../utils/audit'
import { twoFactorEnableRateLimiter } from '../../../utils/rateLimit'
import { pending2FASessions } from '../../../utils/ephemeral-store'
import { createApiError } from '../../../utils/api-error'
import config from '~~/project/puppet-master.config'

export default defineEventHandler(async event => {
  // Check if 2FA is enabled in config
  if (!config.has2FA) {
    throw createApiError(403, 'auth.twoFactorNotEnabled')
  }

  // Require authentication
  if (!event.context.session?.userId) {
    throw createApiError(401, 'auth.authenticationRequired')
  }

  const userId = event.context.session.userId

  // Rate limit by user ID (async for distributed consistency)
  const userIdStr = String(userId)
  const rateLimitAllowed = await twoFactorEnableRateLimiter.checkRateLimitAsync(userIdStr)
  if (!rateLimitAllowed) {
    throw createApiError(429, 'auth.twoFactorVerifyRateLimited')
  }

  const body = await readBody(event)

  // Validate input
  const result = twoFactorEnableSchema.safeParse(body)
  if (!result.success) {
    throw createApiError(400, 'auth.twoFactorInvalidCodeFormat')
  }

  const { code } = result.data

  // Get pending setup from distributed ephemeral store
  const pendingSetup = await pending2FASessions.get(userIdStr)
  if (!pendingSetup) {
    throw createApiError(400, 'auth.twoFactorNoPendingSetup')
  }

  // Check if setup has expired (5 minutes TTL from ephemeral store)
  const setupAge = Date.now() - pendingSetup.createdAt
  if (setupAge > 5 * 60 * 1000) {
    await pending2FASessions.delete(userIdStr)
    throw createApiError(400, 'auth.twoFactorSetupExpired')
  }

  const db = useDatabase()

  // Get user email for TOTP verification
  const user = db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get()

  if (!user) {
    throw createApiError(404, 'admin.users.notFound')
  }

  // Verify the TOTP code using the pending secret
  if (!verifyTotpCode(pendingSetup.secret, code, user.email)) {
    await audit.twoFactorFailed(event, userId, 'invalid_setup_code')
    throw createApiError(400, 'auth.twoFactorInvalidVerificationCode')
  }

  // Store the 2FA secret and backup codes
  const existing2fa = db
    .select({ id: schema.user2fa.id })
    .from(schema.user2fa)
    .where(eq(schema.user2fa.userId, userId))
    .get()

  if (existing2fa) {
    db.update(schema.user2fa)
      .set({
        secret: pendingSetup.encryptedSecret,
        backupCodes: JSON.stringify(pendingSetup.backupCodes.hashed),
        backupCodesRemaining: 10,
        updatedAt: new Date()
      })
      .where(eq(schema.user2fa.userId, userId))
      .run()
  } else {
    db.insert(schema.user2fa)
      .values({
        userId,
        secret: pendingSetup.encryptedSecret,
        backupCodes: JSON.stringify(pendingSetup.backupCodes.hashed),
        backupCodesRemaining: 10
      })
      .run()
  }

  // Enable 2FA on user record
  db.update(schema.users)
    .set({
      twoFactorEnabled: true,
      updatedAt: new Date()
    })
    .where(eq(schema.users.id, userId))
    .run()

  // Clean up pending setup
  await pending2FASessions.delete(userIdStr)

  // Log audit event
  await audit.twoFactorEnabled(event, userId)

  return {
    success: true,
    data: {
      code: 'auth.twoFactorEnabled'
    }
  }
})
