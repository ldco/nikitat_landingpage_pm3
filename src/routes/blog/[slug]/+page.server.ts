import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and } from 'drizzle-orm'
import * as runtime from '$lib/paraglide/runtime.js'

export const load: PageServerLoad = async ({ params }) => {
  const db = useDatabase()
  const locale = runtime.languageTag()

  const post = db.select()
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.slug, params.slug))
    .get()

  if (!post || !post.published) {
    error(404, 'Post not found')
  }

  // Load translation for current locale
  const [translation] = db.select()
    .from(schema.blogPostTranslations)
    .where(and(
      eq(schema.blogPostTranslations.postId, post.id),
      eq(schema.blogPostTranslations.locale, locale)
    ))
    .all()

  // Load category
  let categoryName = ''
  if (post.categoryId) {
    const [cat] = db.select()
      .from(schema.blogCategoryTranslations)
      .where(and(
        eq(schema.blogCategoryTranslations.categoryId, post.categoryId),
        eq(schema.blogCategoryTranslations.locale, locale)
      ))
      .all()
    categoryName = cat?.name ?? ''
  }

  return {
    post: {
      ...post,
      title: translation?.title ?? '',
      excerpt: translation?.excerpt ?? '',
      content: translation?.content ?? '',
      category: categoryName
    }
  }
}
