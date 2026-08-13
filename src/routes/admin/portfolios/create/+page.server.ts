import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { redirect, fail } from '@sveltejs/kit'
import { z } from 'zod'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { uniqueConstraintFieldErrors } from '$lib/server/utils/db-errors'

const insertSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(['gallery', 'case_study', 'branding', 'brandbook', 'website']).default('branding'),
  description: z.string().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.string().optional().nullable()
})

export const load: PageServerLoad = event => {
  requireAdminPage(event, 'portfolios')
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'portfolios')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = insertSchema.safeParse({
      name: form.get('name'),
      slug: form.get('slug'),
      type: form.get('type') || 'branding',
      description: form.get('description') || null,
      coverImageUrl: form.get('coverImageUrl') || null,
      published: form.get('published') || null
    })

    // audit I-10: use fail() so $page.form is populated and use:enhance can
    // surface field errors to the UI (matches the blog/faq/features forms).
    if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })

    const db = useDatabase()
    const published = parsed.data.published === 'on'
    try {
      db.insert(schema.portfolios)
        .values({
          name: parsed.data.name,
          slug: parsed.data.slug,
          type: parsed.data.type,
          description: parsed.data.description || null,
          coverImageUrl: parsed.data.coverImageUrl || null,
          order: 0,
          published,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .run()
    } catch (e: unknown) {
      // Duplicate slug: the portfolios.slug UNIQUE index would otherwise
      // surface as a 500 — map it to a field error on the slug input (same
      // helper contract as blog/faq/features/pricing create actions).
      const fieldErrors = uniqueConstraintFieldErrors(e, [
        { column: 'slug', label: 'apiErrors.admin.slugExists' }
      ])
      if (fieldErrors) return fail(400, { fieldErrors })
      throw e
    }

    redirect(303, ADMIN_ROUTES.portfolios)
  }
}
