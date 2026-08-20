import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import { z } from 'zod'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { updatePortfolio, getPortfolioTranslations, persistPortfolioTranslations, PORTFOLIO_LOCALIZED_FIELDS } from '$lib/server/services/portfolio-admin'
import { getPortfolioCardThumbnails } from '$lib/server/services/portfolio'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import { LOCALES } from '$lib/config/site'
import { PORTFOLIO_TYPES } from '$lib/portfolio-types'

const updateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum(PORTFOLIO_TYPES).default('branding'),
  description: z.string().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.string().optional().nullable()
})

// Every configured locale is persisted to the dedicated translation table
// (ADR-001: ru is a row like any other — no default-locale split).
const ALL_LOCALES = LOCALES

/** Length caps for the per-locale portfolio text overrides (write boundary). */
const portfolioLocalizedMax: Record<string, number> = { name: 200, description: 5000 }

/** Validate the per-locale overrides through Zod (length caps). */
function validatePortfolioLocalizedText(
  form: FormData
): { ok: true; value: Record<string, Record<string, string>> } | { ok: false; response: ReturnType<typeof fail> } {
  const out: Record<string, Record<string, string>> = {}
  for (const locale of ALL_LOCALES) {
    const entry: Record<string, string> = {}
    for (const field of PORTFOLIO_LOCALIZED_FIELDS) {
      const raw = form.get(`${field}_${locale}`)
      entry[field] = typeof raw === 'string' ? raw : ''
    }
    out[locale] = entry
  }
  const fieldSchema = z.object(
    Object.fromEntries(
      PORTFOLIO_LOCALIZED_FIELDS.map(field => [field, z.string().max(portfolioLocalizedMax[field] ?? 5000)])
    )
  )
  for (const locale of ALL_LOCALES) {
    const result = fieldSchema.safeParse(out[locale] ?? {})
    if (!result.success) {
      const issue = result.error.issues[0]
      const field = String(issue?.path?.[0] ?? '')
      return { ok: false, response: fail(400, { fieldErrors: { [`${field}_${locale}`]: ['admin.portfolioTextTooLong'] } }) }
    }
  }
  return { ok: true, value: out }
}

export const load: PageServerLoad = event => {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const portfolio = db
    .select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.id, Number(event.params.id)))
    .get()
  if (!portfolio) error(404)
  return {
    portfolio,
    translations: getPortfolioTranslations([portfolio.id]).get(portfolio.id) ?? {},
    // The first six published item thumbnails power the live card preview's
    // collage fallback (PortfolioCardPreview) — identical resolution to the
    // public listing, so the admin preview matches the site.
    thumbnails: getPortfolioCardThumbnails(portfolio.id)
  }
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

    const portfolioId = Number(event.params.id)

    // Shared admin service: type-change guard, item metadata migration,
    // transaction handling and duplicate-slug mapping are identical to the
    // JSON API PUT path (/api/admin/portfolios/[id]).
    const result = updatePortfolio(portfolioId, {
      name: parsed.data.name,
      slug: parsed.data.slug,
      type: parsed.data.type,
      description: parsed.data.description || null,
      coverImageUrl: parsed.data.coverImageUrl || null,
      published: parsed.data.published === 'on'
    })
    if (!result.ok) return fail(400, { fieldErrors: result.fieldErrors })

    // Per-locale text overrides persist to the translations table
    // (portfolio.<id>.name / .description — the keys the public hydration
    // resolves). The default locale stays column-backed (edited above); the
    // other locales write translation rows. A submitted EMPTY value that
    // previously carried a translation clears the override (the service
    // `nonEmpty` guard then falls back to the column). Values are validated
    // through Zod (length caps) before persisting.
    const localizedCheck = validatePortfolioLocalizedText(form)
    if (!localizedCheck.ok) return localizedCheck.response
    const localized = localizedCheck.value

    const previous = getPortfolioTranslations([portfolioId]).get(portfolioId) ?? {}
    persistPortfolioTranslations(portfolioId, localized, previous, PORTFOLIO_LOCALIZED_FIELDS)
    invalidateContentCache()

    redirect(303, ADMIN_ROUTES.portfolios)
  }
}
