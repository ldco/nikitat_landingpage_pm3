import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'
import { buildPagination, getPaginationParams, getTableCount } from '$lib/server/utils/pagination'
import { loadPortfolioTranslations, localizePortfolio } from '$lib/server/services/portfolio'
import { detectAdminLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const { page, pageSize, offset } = getPaginationParams(event.url, 20)
  const total = getTableCount(schema.portfolios)
  const rows = db.select({ id: schema.portfolios.id, slug: schema.portfolios.slug, name: schema.portfolios.name, type: schema.portfolios.type, published: schema.portfolios.published })
    .from(schema.portfolios)
    .limit(pageSize)
    .offset(offset)
    .all()
  const translations = loadPortfolioTranslations(locale, rows.map(r => r.id))
  const items = rows.map(row => localizePortfolio(row, translations.get(row.id)))
  return { items, pagination: buildPagination(page, pageSize, total) }
}
