import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc, count } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'faq')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const pageParam = Number(event.url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const total = db.select({ n: count() }).from(schema.faqItems).get()?.n ?? 0

  const items = db.select({
    id: schema.faqItems.id,
    slug: schema.faqItems.slug,
    category: schema.faqItems.category,
    published: schema.faqItems.published,
    order: schema.faqItems.order,
    question: schema.faqItemTranslations.question,
    answer: schema.faqItemTranslations.answer
  })
    .from(schema.faqItems)
    .leftJoin(schema.faqItemTranslations, and(
      eq(schema.faqItemTranslations.faqItemId, schema.faqItems.id),
      eq(schema.faqItemTranslations.locale, locale)
    ))
    .orderBy(asc(schema.faqItems.order))
    .limit(limit)
    .offset(offset)
    .all()

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
