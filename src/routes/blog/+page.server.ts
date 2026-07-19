import type { PageServerLoad } from './$types'
import { useDatabase, schema } from '$lib/server/db'
import { desc, eq } from 'drizzle-orm'
import * as runtime from '$lib/paraglide/runtime.js'

export const load: PageServerLoad = async ({ url }) => {
  const db = useDatabase()
  const locale = runtime.languageTag()
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const pageSize = 9
  const offset = (page - 1) * pageSize

  const allPosts = db.select()
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.published, true))
    .orderBy(desc(schema.blogPosts.publishedAt))
    .limit(pageSize)
    .offset(offset)
    .all()

  // Load translations for current locale
  const postIds = allPosts.map(p => p.id)
  const translations = postIds.length > 0
    ? db.select()
        .from(schema.blogPostTranslations)
        .where(eq(schema.blogPostTranslations.locale, locale))
        .all()
        .filter(t => postIds.includes(t.postId))
    : []

  const transMap = new Map(translations.map(t => [t.postId, t]))

  const posts = allPosts.map(p => ({
    ...p,
    title: transMap.get(p.id)?.title ?? '',
    excerpt: transMap.get(p.id)?.excerpt ?? ''
  }))

  const total = db.select({ count: schema.blogPosts.id })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.published, true))
    .all().length

  return {
    posts,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  }
}
