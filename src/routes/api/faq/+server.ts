import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

export function GET(_event: RequestEvent) {
  const db = useDatabase()
  const items = db.select()
    .from(schema.faqItems)
    .where(eq(schema.faqItems.published, true))
    .orderBy(schema.faqItems.order)
    .all()

  return new Response(JSON.stringify(jsonSuccess(items)), {
    headers: { 'content-type': 'application/json' }
  })
}
