import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const createSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
})

export const load: PageServerLoad = (event) => { requireAdminPage(event, 'blog') }

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'blog')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = createSchema.safeParse({ slug: form.get('slug') })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }
    const db = useDatabase()
    db.insert(schema.blogPosts).values({
      slug: parsed.data.slug,
      published: true,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).run()
    redirect(303, '/admin/blog')
  }
}
