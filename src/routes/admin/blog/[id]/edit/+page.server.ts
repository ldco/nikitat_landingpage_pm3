import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { error, redirect } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  requireAdmin(event)
  const db = useDatabase()
  const post = db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, Number(event.params.id))).get()
  if (!post) error(404)
  return { post }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdmin(event)
    const form = await event.request.formData()
    const slug = (form.get('slug') as string)?.toLowerCase().replace(/\s+/g, '-')
    if (!slug) return { success: false, error: 'validation.required' }
    const db = useDatabase()
    db.update(schema.blogPosts).set({ slug, updatedAt: new Date() }).where(eq(schema.blogPosts.id, Number(event.params.id))).run()
    redirect(303, '/admin/blog')
  }
}
