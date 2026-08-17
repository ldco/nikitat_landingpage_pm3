import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { redirect, fail } from '@sveltejs/kit'
import { z } from 'zod'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { createPortfolio } from '$lib/server/services/portfolio-admin'
import { PORTFOLIO_TYPES } from '$lib/portfolio-types'

const insertSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(PORTFOLIO_TYPES).default('branding'),
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

    // Shared admin service: duplicate-slug mapping is identical to the JSON
    // API POST path (/api/admin/portfolios).
    const result = createPortfolio({
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
