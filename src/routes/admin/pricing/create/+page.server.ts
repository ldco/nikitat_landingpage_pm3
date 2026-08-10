import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  price: z.coerce.number().int().min(0).optional()
})

export const load: PageServerLoad = (event) => { requireAdminPage(event, 'pricing') }
export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'pricing')
    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = createSchema.safeParse({ name: form.get('name'), slug: form.get('slug'), price: form.get('price') || undefined })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }
    const db = useDatabase()
    db.insert(schema.pricingTiers).values({
      slug: parsed.data.slug, name: parsed.data.name, price: parsed.data.price ?? null,
      currency: 'USD', period: 'month', featured: false, order: 0,
      published: true, createdAt: new Date(), updatedAt: new Date()
    }).run()
    redirect(303, '/admin/pricing')
  }
}
