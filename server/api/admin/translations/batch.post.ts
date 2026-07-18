/**
 * Admin Translations Batch API - POST
 *
 * Upsert one translation key across multiple locales atomically.
 * Values are validated for every locale before the transaction opens; if any
 * locale is invalid, no rows are written.
 */
import { and, eq } from 'drizzle-orm'
import { schema, transactionSync } from '../../../database/client'
import { isSystemKey } from '../../../../i18n/system'
import type { UserRole } from '../../../database/schema'
import { hasRole } from '../../../utils/roles'
import { syncSystemTranslationsToFile } from '../../../utils/systemTranslationSync'
import { translationCache } from '../../../utils/translationCache'
import { parseBatchTranslationPayload } from '../../../utils/translationValidation'

export default defineEventHandler(async event => {
  const user = event.context.user
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { key, translations, localeErrors } = parseBatchTranslationPayload(await readBody(event))

  if (localeErrors.length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid translation locales',
      data: { localeErrors }
    })
  }

  const isSystem = isSystemKey(key)
  if (isSystem && !hasRole(user.role as UserRole, 'master')) {
    throw createError({
      statusCode: 403,
      message: 'Only master users can edit system translations'
    })
  }

  const now = new Date()
  const results = transactionSync(db => {
    return translations.map(({ locale, value }) => {
      const existingRow = db
        .select()
        .from(schema.translations)
        .where(and(eq(schema.translations.locale, locale), eq(schema.translations.key, key)))
        .limit(1)
        .get()

      if (existingRow) {
        db.update(schema.translations)
          .set({ value, updatedAt: now })
          .where(eq(schema.translations.id, existingRow.id))
          .run()

        return {
          locale,
          action: 'updated' as const,
          id: existingRow.id
        }
      }

      const newRow = db
        .insert(schema.translations)
        .values({ locale, key, value, updatedAt: now })
        .returning({ id: schema.translations.id })
        .get()

      return {
        locale,
        action: 'created' as const,
        id: newRow?.id
      }
    })
  })

  for (const { locale } of translations) {
    translationCache.invalidate(locale)
  }

  if (isSystem) {
    syncSystemTranslationsToFile()
  }

  return {
    success: true,
    data: {
      key,
      results
    }
  }
})
