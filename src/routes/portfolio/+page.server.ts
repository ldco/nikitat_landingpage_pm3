import type { PageServerLoad } from './$types'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

export const load: PageServerLoad = () => {
  const db = useDatabase()
  const items = db.select({ id: schema.portfolios.id, slug: schema.portfolios.slug, name: schema.portfolios.name, type: schema.portfolios.type, coverImageUrl: schema.portfolios.coverImageUrl })
    .from(schema.portfolios)
    .where(eq(schema.portfolios.published, true))
    .orderBy(schema.portfolios.order)
    .all()
  return { items }
}
