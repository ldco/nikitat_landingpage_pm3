import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

export function GET(event: RequestEvent) {
  const locale = event.params.locale
  if (!['ru', 'en', 'fr', 'he'].includes(locale!)) {
    return new Response(JSON.stringify(jsonSuccess({})), {
      headers: { 'content-type': 'application/json' }
    })
  }

  const db = useDatabase()
  const rows = db
    .select({ key: schema.translations.key, value: schema.translations.value })
    .from(schema.translations)
    .where(eq(schema.translations.locale, locale!))
    .all()

  const map: Record<string, string> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }

  return new Response(JSON.stringify(jsonSuccess(map)), {
    headers: { 'content-type': 'application/json' }
  })
}
