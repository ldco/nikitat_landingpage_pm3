import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const portfolioId = Number(event.params.id)
  const portfolio = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, portfolioId)).get()
  if (!portfolio) error(404)

  const items = db.select().from(schema.portfolioItems)
    .where(eq(schema.portfolioItems.portfolioId, portfolioId))
    .orderBy(schema.portfolioItems.order)
    .all()

  return { portfolio, items }
}
