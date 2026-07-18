import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'

export function GET(_event: RequestEvent) {
  const db = useDatabase()
  const allSettings = db.select({
    key: schema.settings.key,
    value: schema.settings.value,
    type: schema.settings.type
  }).from(schema.settings).all()

  // Return as key-value map
  const map: Record<string, string | null> = {}
  for (const s of allSettings) {
    map[s.key] = s.value
  }

  return new Response(JSON.stringify(jsonSuccess(map)), {
    headers: { 'content-type': 'application/json' }
  })
}
