import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { RequestEvent } from '@sveltejs/kit'

const insertSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(['gallery', 'case_study', 'branding', 'brandbook', 'website']).default('branding'),
  description: z.string().nullable().optional()
})

export function load(event: RequestEvent) {
  requireAdmin(event)
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdmin(event)
    const form = await event.request.formData()
    const parsed = insertSchema.safeParse({
      name: form.get('name'),
      slug: form.get('slug'),
      type: form.get('type') || 'branding',
      description: form.get('description') || null
    })

    if (!parsed.success) return { success: false, error: 'validation.required' }

    const db = useDatabase()
    db.insert(schema.portfolios).values({
      ...parsed.data, order: 0, published: true,
      createdAt: new Date(), updatedAt: new Date()
    }).run()

    redirect(303, '/admin/portfolios')
  }
}
