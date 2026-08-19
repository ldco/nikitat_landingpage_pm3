import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, desc, inArray } from 'drizzle-orm'
import type { PageServerLoad } from './$types'
import { detectAdminLocale } from '$lib/server/utils/locales'
import { buildPagination, getPaginationParams, getTableCount } from '$lib/server/utils/pagination'

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'blog')
  const db = useDatabase()
  const locale = detectAdminLocale(event)

  const { page, pageSize, offset } = getPaginationParams(event.url, 20)
  const total = getTableCount(schema.blogPosts)

  const posts = db.select({
    id: schema.blogPosts.id,
    slug: schema.blogPosts.slug,
    coverImageUrl: schema.blogPosts.coverImageUrl,
    published: schema.blogPosts.published,
    publishedAt: schema.blogPosts.publishedAt,
    categoryId: schema.blogPosts.categoryId,
    title: schema.blogPostTranslations.title
  })
    .from(schema.blogPosts)
    .leftJoin(schema.blogPostTranslations, and(
      eq(schema.blogPostTranslations.postId, schema.blogPosts.id),
      eq(schema.blogPostTranslations.locale, locale)
    ))
    .orderBy(desc(schema.blogPosts.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all()

  const categoryIds = [...new Set(posts.map(p => p.categoryId).filter((c): c is number => c !== null))]
  const categories = categoryIds.length > 0
    ? db.select({
        id: schema.blogCategories.id,
        name: schema.blogCategoryTranslations.name
      })
        .from(schema.blogCategories)
        .leftJoin(schema.blogCategoryTranslations, and(
          eq(schema.blogCategoryTranslations.categoryId, schema.blogCategories.id),
          eq(schema.blogCategoryTranslations.locale, locale)
        ))
        .where(inArray(schema.blogCategories.id, categoryIds))
        .all()
    : []

  const catMap = new Map(categories.map(c => [c.id, c.name]))

  const postIds = posts.map(p => p.id)
  const tags = postIds.length > 0
    ? db.select({
        postId: schema.blogPostTags.postId,
        name: schema.blogTags.name
      })
        .from(schema.blogPostTags)
        .innerJoin(schema.blogTags, eq(schema.blogTags.id, schema.blogPostTags.tagId))
        .where(inArray(schema.blogPostTags.postId, postIds))
        .all()
    : []

  const tagsMap = new Map<number, string[]>()
  for (const t of tags) {
    const tagList = tagsMap.get(t.postId)
    if (tagList) tagList.push(t.name)
    else tagsMap.set(t.postId, [t.name])
  }

  const localeRows = postIds.length > 0
    ? db.select({ postId: schema.blogPostTranslations.postId, locale: schema.blogPostTranslations.locale })
        .from(schema.blogPostTranslations)
        .where(inArray(schema.blogPostTranslations.postId, postIds))
        .all()
    : []

  const localesMap = new Map<number, string[]>()
  for (const lr of localeRows) {
    const locList = localesMap.get(lr.postId)
    if (locList) locList.push(lr.locale)
    else localesMap.set(lr.postId, [lr.locale])
  }

  return {
    items: posts.map(p => ({
      ...p,
      title: p.title ?? p.slug,
      category: catMap.get(p.categoryId ?? 0) ?? null,
      tags: tagsMap.get(p.id) ?? [],
      locales: localesMap.get(p.id) ?? []
    })),
    pagination: buildPagination(page, pageSize, total)
  }
}
