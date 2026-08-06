import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { error, redirect } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async (event) => {
  requireAdmin(event)
  const db = useDatabase()
  const item = db.select().from(schema.pricingTiers).where(eq(schema.pricingTiers.id, Number(event.params.id))).get()
  if (!item) error(404)
  return { item }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdmin(event)
    const form = await event.request.formData()
    const slug = (form.get('slug') as string)?.toLowerCase().replace(/\s+/g, '-')
    const name = form.get('name') as string
    const price = form.get('price') as string
    if (!slug || !name) return { success: false, error: 'validation.required' }
    const db = useDatabase()
    db.update(schema.pricingTiers).set({
      slug, name, price: price ? parseInt(price) : null, updatedAt: new Date()
    }).where(eq(schema.pricingTiers.id, Number(event.params.id))).run()
    redirect(303, '/admin/pricing')
  }
}
