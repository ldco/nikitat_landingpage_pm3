import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const createSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
})

export const load: PageServerLoad = (event) => { requireAdminPage(event, 'features') }

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'features')
    const form = await event.request.formData()
    const parsed = createSchema.safeParse({ slug: form.get('slug') })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }
    const db = useDatabase()
    db.insert(schema.features).values({ slug: parsed.data.slug, published: true, order: 0, createdAt: new Date() }).run()
    redirect(303, '/admin/features')
  }
}
