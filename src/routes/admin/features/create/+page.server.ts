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
    if (!slug) return { success: false, error: 'validation.required' }
    const db = useDatabase()
    db.insert(schema.features).values({ slug, published: true, order: 0, createdAt: new Date() }).run()
    redirect(303, '/admin/features')
  }
}
