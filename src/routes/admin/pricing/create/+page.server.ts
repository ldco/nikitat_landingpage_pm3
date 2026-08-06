import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => { requireAdmin(event) }
export const actions = {
  default: async (event: RequestEvent) => {
    requireAdmin(event)
    const form = await event.request.formData()
    const slug = (form.get('slug') as string)?.toLowerCase().replace(/\s+/g, '-')
    const name = form.get('name') as string
    const price = form.get('price') as string
    if (!slug || !name) return { success: false, error: 'validation.required' }
    const db = useDatabase()
    db.insert(schema.pricingTiers).values({
      slug, name, price: price ? parseInt(price) : null, currency: 'USD', period: 'month',
      featured: false, order: 0, published: true, createdAt: new Date(), updatedAt: new Date()
    }).run()
    redirect(303, '/admin/pricing')
  }
}
