import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'faq')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

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
    .all()

  return { items }
}
