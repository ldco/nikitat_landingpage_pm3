import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const updateSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
})

export const load: PageServerLoad = async (event) => {
  requireAdminPage(event, 'blog')
  const db = useDatabase()
  const post = db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, Number(event.params.id))).get()
  if (!post) error(404)
  return { post }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'blog')
    const form = await event.request.formData()
    const parsed = updateSchema.safeParse({ slug: form.get('slug') })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }
    const db = useDatabase()
    db.update(schema.blogPosts).set({ slug: parsed.data.slug, updatedAt: new Date() }).where(eq(schema.blogPosts.id, Number(event.params.id))).run()
    redirect(303, '/admin/blog')
  }
}
