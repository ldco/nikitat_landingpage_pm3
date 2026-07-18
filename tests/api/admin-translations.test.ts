import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { and, eq } from 'drizzle-orm'
import { schema, useDatabase } from '../../server/database/client'
import { expectFetchError, loginAsMaster } from '../utils/helpers'
import { setupApiTest, waitForApiServer } from '../utils/api-test-setup'

const createdKeys = new Set<string>()

function uniqueKey(prefix: string): string {
  const key = `${prefix}.value${Date.now()}${Math.floor(Math.random() * 10000)}`
  createdKeys.add(key)
  return key
}

function cleanupCreatedTranslationRows() {
  if (createdKeys.size === 0) return

  const db = useDatabase()
  for (const key of createdKeys) {
    db.delete(schema.translations).where(eq(schema.translations.key, key)).run()
  }
  createdKeys.clear()
}

function getTranslationRows(key: string) {
  const db = useDatabase()
  return db
    .select()
    .from(schema.translations)
    .where(eq(schema.translations.key, key))
    .all()
}

interface I18nRegressionResponse {
  success: true
  data: {
    regression?: {
      empty?: Record<string, string>
    }
  }
}

describe('Admin Translations API', async () => {
  await setupApiTest(43101)

  beforeAll(async () => {
    await waitForApiServer(43101)
  })

  afterEach(() => {
    cleanupCreatedTranslationRows()
  })

  it('rejects invalid locale and key variants with 400', async () => {
    const auth = await loginAsMaster()

    await expectFetchError(
      $fetch('/api/admin/translations', {
        method: 'POST',
        headers: auth.headers,
        body: {
          locale: 'fr',
          key: uniqueKey('regression.invalidLocale'),
          value: 'Bonjour'
        }
      }),
      400,
      'Invalid locale'
    )

    await expectFetchError(
      $fetch('/api/admin/translations', {
        method: 'POST',
        headers: auth.headers,
        body: {
          locale: 'en',
          key: 'bad key',
          value: 'Bad key'
        }
      }),
      400,
      'Invalid translation key'
    )

    await expectFetchError(
      $fetch('/api/admin/translations', {
        method: 'POST',
        headers: auth.headers,
        body: {
          locale: 'en',
          key: 'missingDot',
          value: 'Bad key'
        }
      }),
      400,
      'Invalid translation key'
    )
  })

  it('normalizes locale and key before upsert while preserving empty-string values', async () => {
    const auth = await loginAsMaster()
    const key = uniqueKey('regression.normalized')

    await $fetch('/api/admin/translations', {
      method: 'POST',
      headers: auth.headers,
      body: {
        locale: ' EN ',
        key: ` ${key} `,
        value: ''
      }
    })

    const db = useDatabase()
    const row = db
      .select()
      .from(schema.translations)
      .where(and(eq(schema.translations.locale, 'en'), eq(schema.translations.key, key)))
      .get()

    expect(row?.value).toBe('')

    await $fetch('/api/admin/translations', {
      method: 'POST',
      headers: auth.headers,
      body: {
        locale: 'en',
        key,
        value: 'Updated'
      }
    })

    const rows = db
      .select()
      .from(schema.translations)
      .where(and(eq(schema.translations.locale, 'en'), eq(schema.translations.key, key)))
      .all()

    expect(rows).toHaveLength(1)
    expect(rows[0]?.value).toBe('Updated')
  })

  it('upserts one key across locales atomically through the batch endpoint', async () => {
    const auth = await loginAsMaster()
    const key = uniqueKey('regression.batch')

    const response = await $fetch<{ success: true; data: { key: string } }>('/api/admin/translations/batch', {
      method: 'POST',
      headers: auth.headers,
      body: {
        key: ` ${key} `,
        values: {
          ' EN ': 'English value',
          ru: 'Русское значение'
        }
      }
    })

    expect(response.success).toBe(true)
    expect(response.data.key).toBe(key)

    const rows = getTranslationRows(key)
    expect(rows).toHaveLength(2)
    expect(rows.find(row => row.locale === 'en')?.value).toBe('English value')
    expect(rows.find(row => row.locale === 'ru')?.value).toBe('Русское значение')
  })

  it('returns per-locale validation errors and does not partially write batch payloads', async () => {
    const auth = await loginAsMaster()
    const key = uniqueKey('regression.batchInvalid')

    const error = await expectFetchError(
      $fetch('/api/admin/translations/batch', {
        method: 'POST',
        headers: auth.headers,
        body: {
          key,
          values: {
            en: 'Should not be written',
            fr: 'Invalid locale'
          }
        }
      }),
      400,
      'Invalid translation locales'
    )

    expect(error.data?.data).toMatchObject({
      localeErrors: [
        {
          locale: 'fr'
        }
      ]
    })
    expect(getTranslationRows(key)).toHaveLength(0)
  })

  it('keeps empty-string translations in cache responses so they do not disappear behind fallback locales', async () => {
    const auth = await loginAsMaster()
    const key = uniqueKey('regression.empty')

    await $fetch('/api/admin/translations/batch', {
      method: 'POST',
      headers: auth.headers,
      body: {
        key,
        values: {
          en: '',
          ru: 'Русский fallback'
        }
      }
    })

    const enResponse = await $fetch<I18nRegressionResponse>(`/api/i18n/en`)
    const ruResponse = await $fetch<I18nRegressionResponse>(`/api/i18n/ru`)
    const leafKey = key.split('.').at(-1)!

    expect(Object.prototype.hasOwnProperty.call(enResponse.data.regression?.empty, leafKey)).toBe(true)
    expect(enResponse.data.regression?.empty?.[leafKey]).toBe('')
    expect(ruResponse.data.regression?.empty?.[leafKey]).toBe('Русский fallback')
  })
})
