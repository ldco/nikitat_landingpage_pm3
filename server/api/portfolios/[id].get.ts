import { eq, and, desc, like, or } from 'drizzle-orm'
import { useDatabase, schema } from '../../database/client'
import { safeJsonParse } from '../../utils/json'
import { hasAdminSectionAccess } from '../../utils/admin-rbac'

export default defineEventHandler(async event => {
  const db = useDatabase()
  const idOrSlug = getRouterParam(event, 'id')
  const query = getQuery(event)
  const user = event.context.user
  const locale = (query.locale as string) || 'ru'

  if (!idOrSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Portfolio ID or slug required' })
  }

  const isNumericId = /^\d+$/.test(idOrSlug)

  const portfolio = isNumericId
    ? db.select().from(schema.portfolios).where(eq(schema.portfolios.id, parseInt(idOrSlug))).get()
    : db.select().from(schema.portfolios).where(eq(schema.portfolios.slug, idOrSlug)).get()

  if (!portfolio) {
    throw createError({ statusCode: 404, statusMessage: 'Portfolio not found' })
  }

  const canReadUnpublished = user ? await hasAdminSectionAccess(user, 'portfolios') : false

  if (!portfolio.published && !canReadUnpublished) {
    if (user) {
      throw createError({ statusCode: 403, statusMessage: 'Access denied: unpublished portfolios require portfolios section access' })
    }
    throw createError({ statusCode: 404, statusMessage: 'Portfolio not found' })
  }

  const includeItems = query.includeItems !== 'false'
  let items: Array<Record<string, unknown>> = []

  // Load all translations for this portfolio once
  const allTranslations = db
    .select()
    .from(schema.translations)
    .where(like(schema.translations.key, 'portfolio_item.%'))
    .all()

  const getItemTranslations = (itemId: number) => {
    const titleKey = `portfolio_item.${itemId}.title`
    const descKey = `portfolio_item.${itemId}.description`
    const contentKey = `portfolio_item.${itemId}.content`
    const categoryKey = `portfolio_item.${itemId}.category`
    const map: Record<string, { title: string | null; description: string | null; content: string | null; category: string | null }> = {}
    const locales = new Set(allTranslations.filter(t => t.key === titleKey || t.key === descKey || t.key === contentKey || t.key === categoryKey).map(t => t.locale))
    locales.forEach(l => {
      map[l] = {
        title: allTranslations.find(t => t.key === titleKey && t.locale === l)?.value || null,
        description: allTranslations.find(t => t.key === descKey && t.locale === l)?.value || null,
        content: allTranslations.find(t => t.key === contentKey && t.locale === l)?.value || null,
        category: allTranslations.find(t => t.key === categoryKey && t.locale === l)?.value || null
      }
    })
    return map
  }

  if (includeItems) {
    const itemConditions = [eq(schema.portfolioItems.portfolioId, portfolio.id)]
    if (!canReadUnpublished) {
      itemConditions.push(eq(schema.portfolioItems.published, true))
    }

    items = db
      .select()
      .from(schema.portfolioItems)
      .where(itemConditions.length === 1 ? itemConditions[0] : and(...itemConditions))
      .orderBy(desc(schema.portfolioItems.order), desc(schema.portfolioItems.createdAt))
      .all()

    items = items.map(item => {
      const parsed = { ...item, tags: safeJsonParse(item.tags as string, []) }
      const trans = getItemTranslations(item.id)
      return {
        ...parsed,
        title: trans[locale]?.title || parsed.title,
        description: trans[locale]?.description || parsed.description,
        content: trans[locale]?.content || parsed.content,
        category: trans[locale]?.category || parsed.category
      }
    })
  }

  // Portfolio-level translations
  const portfolioTitleKey = `portfolio.${portfolio.id}.name`
  const portfolioDescKey = `portfolio.${portfolio.id}.description`
  const portfolioTrans = db
    .select()
    .from(schema.translations)
    .where(or(eq(schema.translations.key, portfolioTitleKey), eq(schema.translations.key, portfolioDescKey)))
    .all()

  return {
    success: true,
    data: {
      ...portfolio,
      name: portfolioTrans.find(t => t.key === portfolioTitleKey && t.locale === locale)?.value || portfolio.name,
      description: portfolioTrans.find(t => t.key === portfolioDescKey && t.locale === locale)?.value || portfolio.description,
      items
    }
  }
})
