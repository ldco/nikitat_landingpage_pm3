import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import { z } from 'zod'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { updatePortfolio } from '$lib/server/services/portfolio-admin'

const updateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(['gallery', 'case_study', 'branding', 'brandbook', 'website']).default('branding'),
  description: z.string().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.string().optional().nullable()
})

export const load: PageServerLoad = event => {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const portfolio = db
    .select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.id, Number(event.params.id)))
    .get()
  if (!portfolio) error(404)
  return { portfolio }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'portfolios')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = updateSchema.safeParse({
      name: form.get('name'),
      slug: form.get('slug'),
      type: form.get('type') || 'branding',
      description: form.get('description') || null,
      coverImageUrl: form.get('coverImageUrl') || null,
      published: form.get('published') || null
    })

    // audit I-10: fail() so field errors surface to the UI (matches create).
    if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })

    // Shared admin service: type-change guard, item metadata migration,
    // transaction handling and duplicate-slug mapping are identical to the
    // JSON API PUT path (/api/admin/portfolios/[id]).
    const result = updatePortfolio(Number(event.params.id), {
      name: parsed.data.name,
      slug: parsed.data.slug,
      type: parsed.data.type,
      description: parsed.data.description || null,
      coverImageUrl: parsed.data.coverImageUrl || null,
      published: parsed.data.published === 'on'
    })
    if (!result.ok) return fail(400, { fieldErrors: result.fieldErrors })

    redirect(303, ADMIN_ROUTES.portfolios)
  }
}
