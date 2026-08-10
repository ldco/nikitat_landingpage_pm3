import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import { z } from 'zod'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const insertSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(['gallery', 'case_study', 'branding', 'brandbook', 'website']).default('branding'),
  description: z.string().nullable().optional()
})

export const load: PageServerLoad = (event) => {
  requireAdminPage(event, 'portfolios')
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'portfolios')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = insertSchema.safeParse({
      name: form.get('name'),
      slug: form.get('slug'),
      type: form.get('type') || 'branding',
      description: form.get('description') || null
    })

    // audit I-10: use fail() so $page.form is populated and use:enhance can
    // surface field errors to the UI (matches the blog/faq/features forms).
    if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })

    const db = useDatabase()
    db.insert(schema.portfolios).values({
      ...parsed.data, order: 0, published: true,
      createdAt: new Date(), updatedAt: new Date()
    }).run()

    redirect(303, '/admin/portfolios')
  }
}
