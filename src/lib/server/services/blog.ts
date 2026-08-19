/**
 * Blog Service — Typed queries for blog posts + translations
 *
 * Owns the shared blog queries used by:
 *   - Homepage section (+page.server.ts)
 *   - Blog list page (blog/+page.server.ts)
 *   - Blog detail page (blog/[slug]/+page.server.ts)
 *
 * Every translation join is filtered by locale so list content matches
 * detail pages in multi-locale DBs.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, desc, inArray } from 'drizzle-orm'
import type { BlogPostCard } from '$lib/components/sections/types'
import { getFilteredCount } from '$lib/server/utils/pagination'

export interface BlogListPost extends BlogPostCard {
  excerpt?: string
}

export interface BlogPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface BlogPostDetail {
  id: number
  slug: string
  coverImageUrl?: string | null
  coverImageAlt?: string | null
  publishedAt?: Date | null
  readingTimeMinutes?: number | null
  title: string
  excerpt?: string
  content?: string
  category?: string
  published: boolean
}

/** Homepage section: latest 6 published posts with current-locale translation. */
export function getHomepagePosts(locale: string, limit = 6): BlogListPost[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.blogPosts.id,
    slug: schema.blogPosts.slug,
    coverImageUrl: schema.blogPosts.coverImageUrl,
    coverImageAlt: schema.blogPosts.coverImageAlt,
    publishedAt: schema.blogPosts.publishedAt,
    readingTimeMinutes: schema.blogPosts.readingTimeMinutes,
    title: schema.blogPostTranslations.title,
    excerpt: schema.blogPostTranslations.excerpt
  })
    .from(schema.blogPosts)
    .leftJoin(schema.blogPostTranslations, and(
      eq(schema.blogPostTranslations.postId, schema.blogPosts.id),
      eq(schema.blogPostTranslations.locale, locale)
    ))
    .where(eq(schema.blogPosts.published, true))
    .orderBy(desc(schema.blogPosts.publishedAt))
    .limit(limit)
    .all()

  return rows
    .filter(r => r.title)
    .map(r => ({
      id: r.id,
      slug: r.slug,
      title: r.title ?? '',
      excerpt: r.excerpt ?? undefined,
      coverImageUrl: r.coverImageUrl ?? undefined,
      coverImageAlt: r.coverImageAlt ?? undefined,
      publishedAt: r.publishedAt ?? undefined,
      readingTimeMinutes: r.readingTimeMinutes ?? undefined
    }))
}

/** Blog list page: paginated published posts with current-locale translation. */
export function getPostsPaginated(locale: string, page: number, pageSize = 9): { posts: BlogListPost[]; pagination: BlogPagination } {
  const db = useDatabase()
  const offset = (page - 1) * pageSize

  const allPosts = db.select({
    id: schema.blogPosts.id,
    slug: schema.blogPosts.slug,
    coverImageUrl: schema.blogPosts.coverImageUrl,
    coverImageAlt: schema.blogPosts.coverImageAlt,
    publishedAt: schema.blogPosts.publishedAt,
    readingTimeMinutes: schema.blogPosts.readingTimeMinutes
  })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.published, true))
    .orderBy(desc(schema.blogPosts.publishedAt))
    .limit(pageSize)
    .offset(offset)
    .all()

  const postIds = allPosts.map(p => p.id)
  const translations = postIds.length > 0
    ? db.select({
        postId: schema.blogPostTranslations.postId,
        title: schema.blogPostTranslations.title,
        excerpt: schema.blogPostTranslations.excerpt
      })
        .from(schema.blogPostTranslations)
        .where(and(
          eq(schema.blogPostTranslations.locale, locale),
          inArray(schema.blogPostTranslations.postId, postIds)
        ))
        .all()
    : []

  const transMap = new Map(translations.map(t => [t.postId, t]))

  const posts: BlogListPost[] = allPosts.map(p => ({
    ...p,
    title: transMap.get(p.id)?.title ?? '',
    excerpt: transMap.get(p.id)?.excerpt ?? undefined
  }))

  const total = getFilteredCount(schema.blogPosts, eq(schema.blogPosts.published, true))

  return {
    posts,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  }
}

/** Blog detail page: post by slug + current-locale translation + category. */
export function getPostBySlug(locale: string, slug: string): BlogPostDetail | null {
  const db = useDatabase()
  const post = db.select().from(schema.blogPosts).where(eq(schema.blogPosts.slug, slug)).get()
  if (!post) return null

  const translation = db.select({
    title: schema.blogPostTranslations.title,
    excerpt: schema.blogPostTranslations.excerpt,
    content: schema.blogPostTranslations.content
  })
    .from(schema.blogPostTranslations)
    .where(and(
      eq(schema.blogPostTranslations.postId, post.id),
      eq(schema.blogPostTranslations.locale, locale)
    ))
    .get()

  let category = ''
  if (post.categoryId) {
    const cat = db.select({ name: schema.blogCategoryTranslations.name })
      .from(schema.blogCategoryTranslations)
      .where(and(
        eq(schema.blogCategoryTranslations.categoryId, post.categoryId),
        eq(schema.blogCategoryTranslations.locale, locale)
      ))
      .get()
    category = cat?.name ?? ''
  }

  return {
    id: post.id,
    slug: post.slug,
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,
    publishedAt: post.publishedAt,
    readingTimeMinutes: post.readingTimeMinutes,
    title: translation?.title ?? '',
    excerpt: translation?.excerpt ?? '',
    content: translation?.content ?? '',
    category,
    published: post.published ?? false
  }
}
