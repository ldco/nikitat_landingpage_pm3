import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

export function GET(_event: RequestEvent) {
  const db = useDatabase()
  const tiers = db.select()
    .from(schema.pricingTiers)
    .where(eq(schema.pricingTiers.published, true))
    .orderBy(schema.pricingTiers.order)
    .all()

  return new Response(JSON.stringify(jsonSuccess(tiers)), {
    headers: { 'content-type': 'application/json' }
  })
}
