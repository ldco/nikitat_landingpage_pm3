import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const localeSchema = z.enum(['ru', 'en', 'fr', 'he'])

export function GET(event: RequestEvent) {
  const locale = event.params.locale ?? ''
  const parsed = localeSchema.safeParse(locale)
  if (!parsed.success) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'validation.locale', message: 'Invalid locale. Supported: ru, en, fr, he' }
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    })
  }

  const db = useDatabase()
  const rows = db
    .select({ key: schema.translations.key, value: schema.translations.value })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale))
    .all()

  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }

  return new Response(JSON.stringify(jsonSuccess(map)), {
    headers: { 'content-type': 'application/json' }
  })
}
