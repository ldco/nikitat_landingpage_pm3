import { z } from 'zod'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

const updateSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
})

export const load: PageServerLoad = async (event) => {
  requireAdmin(event)
  const db = useDatabase()
  const item = db.select().from(schema.faqItems).where(eq(schema.faqItems.id, Number(event.params.id))).get()
  if (!item) error(404)
  return { item }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdmin(event)
    const form = await event.request.formData()
    const parsed = updateSchema.safeParse({ slug: form.get('slug') })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }
    const db = useDatabase()
    db.update(schema.faqItems).set({ slug: parsed.data.slug }).where(eq(schema.faqItems.id, Number(event.params.id))).run()
    redirect(303, '/admin/faq')
  }
}
