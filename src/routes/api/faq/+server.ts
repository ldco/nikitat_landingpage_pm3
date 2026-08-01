import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({})

export function GET(event: RequestEvent) {
  const parsedQuery = querySchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsedQuery.success) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'validation.query', message: 'Invalid query parameters' }
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    })
  }
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
