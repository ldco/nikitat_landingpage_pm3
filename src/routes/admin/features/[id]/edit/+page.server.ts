import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { error, redirect } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'

export async function load(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const item = db.select().from(schema.features).where(eq(schema.features.id, Number(event.params.id))).get()
  if (!item) error(404)
  return { item }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdmin(event)
    const form = await event.request.formData()
    const slug = (form.get('slug') as string)?.toLowerCase().replace(/\s+/g, '-')
    if (!slug) return { success: false, error: 'validation.required' }
    const db = useDatabase()
    db.update(schema.features).set({ slug, order: Number(form.get('order')) || 0 }).where(eq(schema.features.id, Number(event.params.id))).run()
    redirect(303, '/admin/features')
  }
}
