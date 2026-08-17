import { error, fail, redirect } from '@sveltejs/kit'
import { eq, desc, asc, and } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { getAdminPortfolioItems } from '$lib/server/services/portfolio'
import {
  getPortfolioItemTranslations,
  portfolioItemLocalizedFieldsFor,
  type PortfolioItemLocalizedField
} from '$lib/server/services/portfolio-admin'
import { enrichPortfolioItemsFromSource } from '$lib/server/services/portfolio-pm2-source'
import { setTranslations, deleteTranslations } from '$lib/server/services/translations'
import { invalidateContentCache } from '$lib/server/db/content-cache'
import { LOCALES, DEFAULT_LOCALE } from '$lib/config/site'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { normalizeItemMetadata, safeMediaUrl, portfolioTypeRequiresMetadata } from '$lib/portfolio-metadata'
import { markAdminMetadata, metadataDeepEqual } from '$lib/portfolio-metadata-import'
import { portfolioItemTypesFor } from '$lib/portfolio-metadata-form'
import type { PageServerLoad, Actions } from './$types'

// Per-locale text overrides for an item (<field>_<locale> form fields) — the
// default locale maps to the base columns; the other locales persist to the
// translations table as `portfolio_item.<id>.<field>`.
const NON_DEFAULT_LOCALES = LOCALES.filter(locale => locale !== DEFAULT_LOCALE)

/** Per-field length caps for the per-locale text overrides (write boundary). */
const localizedFieldMax: Record<PortfolioItemLocalizedField, number> = {
  title: 500,
  description: 5000,
  content: 50000,
  category: 200
}

/** Zod schema over the localized fields for ONE locale (length-capped). */
function buildLocalizedFieldSchema(fields: readonly PortfolioItemLocalizedField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    shape[field] = z.string().max(localizedFieldMax[field] ?? 20000)
  }
  return z.object(shape)
}

/**
 * Validate the collected per-locale text overrides through the SAME Zod
 * boundary as every other admin field — the per-locale values feed public
 * portfolio sinks, so an over-length payload must be rejected, not truncated.
 */
function validateLocalizedItemText(
  localized: Record<string, Record<string, string>>,
  fields: readonly PortfolioItemLocalizedField[]
): { ok: true } | { ok: false; response: ReturnType<typeof fail> } {
  const fieldSchema = buildLocalizedFieldSchema(fields)
  for (const locale of NON_DEFAULT_LOCALES) {
    const result = fieldSchema.safeParse(localized[locale] ?? {})
    if (!result.success) {
      const issue = result.error.issues[0]
      const field = String(issue?.path?.[0] ?? '')
      return { ok: false, response: fail(400, { fieldErrors: { [`${field}_${locale}`]: ['admin.portfolioTextTooLong'] } }) }
    }
  }
  return { ok: true }
}

/**
 * Parse + validate the `metadata` form field (a JSON string) against the
 * portfolio's per-type schema via the shared adapter. Returns the validated
 * JSON string to store (carrying the admin-edit marker, so a later PM2
 * fallback never rehydrates fields this editor intentionally cleared), or a
 * fail() response for invalid payloads. Empty metadata stores null — EXCEPT
 * for branding/website, whose REQUIRED canonical `gallery`/`screenshots`
 * array is the whole point of the metadata contract: a missing payload there
 * is rejected (never silently stored as null).
 */
function validateItemMetadata(
  raw: FormDataEntryValue | null,
  portfolioType: string
): { ok: true; value: string | null; raw: string | null } | { ok: false; response: ReturnType<typeof fail> } {
  if (!raw) {
    if (portfolioTypeRequiresMetadata(portfolioType)) {
      return { ok: false, response: fail(400, { fieldErrors: { metadata: ['admin.portfolioMetadataInvalid'] } }) }
    }
    return { ok: true, value: null, raw: null }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(String(raw))
  } catch {
    return { ok: false, response: fail(400, { fieldErrors: { metadata: ['admin.portfolioMetadataInvalid'] } }) }
  }
  const normalized = normalizeItemMetadata(parsed, portfolioType)
  if (normalized === null) {
    return { ok: false, response: fail(400, { fieldErrors: { metadata: ['admin.portfolioMetadataInvalid'] } }) }
  }
  return { ok: true, value: markAdminMetadata(normalized), raw: normalized }
}

const createItemSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']),
  mediaUrl: safeMediaUrl.nullable().optional(),
  thumbnailUrl: safeMediaUrl.nullable().optional(),
  caption: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  metadata: z.string().nullable().optional(),
  published: z.string().optional().nullable()
})

const updateItemSchema = createItemSchema.extend({
  id: z.coerce.number().int().positive()
})

const moveSchema = z.object({
  id: z.coerce.number().int().positive(),
  dir: z.coerce.number().int().min(-1).max(1)
})

const idSchema = z.object({
  id: z.coerce.number().int().positive()
})

/**
 * The submitted item type must be renderable by the parent portfolio's viewers
 * (e.g. `website` with `link`, `brandbook` with `video` are rejected). Shared
 * by the create/update actions — field-level error on `itemType`. A row that
 * ALREADY carries a type outside the current portfolio matrix (a legacy/
 * imported row, or one left by a portfolio type change) must stay editable:
 * the guard fires only when the type is actually being CHANGED (`existingType`
 * differs), so the admin can fix or keep the existing value without being
 * locked out of the item.
 */
function validateItemType(
  itemType: string,
  portfolioType: string,
  existingType?: string
): { ok: true } | { ok: false; response: ReturnType<typeof fail> } {
  if (portfolioItemTypesFor(portfolioType).includes(itemType as never)) return { ok: true }
  if (existingType === itemType) return { ok: true }
  return { ok: false, response: fail(400, { fieldErrors: { itemType: ['admin.itemTypeNotAllowed'] } }) }
}

/**
 * Collect the submitted per-locale text overrides (`<field>_<locale>`) from a
 * form for the rendered field set. Every per-locale input is always mounted in
 * the editor, so each field is present (possibly empty) — the caller decides
 * write vs. clear. Only fields the editor RENDERS for the portfolio type are
 * collected: an unrendered field (e.g. `content` for gallery/brandbook) must
 * never reach the clear branch, or it would wipe an imported row the editor
 * never showed.
 */
function collectLocalizedItemText(
  form: FormData,
  fields: readonly PortfolioItemLocalizedField[]
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {}
  for (const locale of NON_DEFAULT_LOCALES) {
    for (const field of fields) {
      const raw = form.get(`${field}_${locale}`)
      const value = typeof raw === 'string' ? raw : ''
      ;(out[locale] ??= {})[field] = value
    }
  }
  return out
}

/**
 * Persist the per-locale text overrides for one item to the translations
 * table (`portfolio_item.<id>.<field>` — the keys the public hydration
 * resolves). A non-empty submitted value is written (upsert, customized);
 * an EMPTY value that previously carried a translation clears the override
 * (the service `nonEmpty` guard then falls back to the column). Empty values
 * with no prior row are skipped entirely.
 */
function persistItemLocalizedText(
  itemId: number,
  localized: Record<string, Record<string, string>>,
  previous: Record<string, Record<string, string>>,
  fields: readonly PortfolioItemLocalizedField[]
): void {
  for (const locale of NON_DEFAULT_LOCALES) {
    const entries: Array<{ key: string; value: string }> = []
    for (const field of fields) {
      const submitted = localized[locale]?.[field] ?? ''
      const had = previous[locale]?.[field]
      if (submitted.trim() !== '') {
        entries.push({ key: `portfolio_item.${itemId}.${field}`, value: submitted })
      } else if (had) {
        entries.push({ key: `portfolio_item.${itemId}.${field}`, value: '' })
      }
    }
    if (entries.length > 0) setTranslations(locale, entries)
  }
  invalidateContentCache()
}

export const load: PageServerLoad = event => {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const portfolioId = Number(event.params.id)
  const portfolio = db
    .select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.id, portfolioId))
    .get()
  if (!portfolio) error(404)

  // Enriched shape (shared with the public detail page): already-imported
  // sparse PM2 rows render their backfilled media/description/metadata instead
  // of blank admin fields (see getAdminPortfolioItems).
  const items = getAdminPortfolioItems(portfolioId, portfolio.type)

  // Per-locale text overrides keyed by item id, so the editor pre-populates
  // its language tabs from the SAME translation rows the public site renders.
  const itemTranslations = Object.fromEntries(
    getPortfolioItemTranslations(items.map(item => item.id))
  )

  return { portfolio, items, itemTranslations }
}

export const actions: Actions = {
  /** Create an item; order is appended after the persisted max (never client-derived). */
  create: async event => {
    requireAdminPage(event, 'portfolios')
    const portfolioId = Number(event.params.id)
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = createItemSchema.safeParse({
      itemType: form.get('itemType'),
      mediaUrl: form.get('mediaUrl') || null,
      thumbnailUrl: form.get('thumbnailUrl') || null,
      caption: form.get('caption') || null,
      title: form.get('title') || null,
      description: form.get('description') || null,
      content: form.get('content') || null,
      metadata: form.get('metadata') || undefined,
      published: form.get('published') || null
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()
    const portfolio = db
      .select()
      .from(schema.portfolios)
      .where(eq(schema.portfolios.id, portfolioId))
      .get()
    if (!portfolio) error(404)

    const typeCheck = validateItemType(parsed.data.itemType, portfolio.type)
    if (!typeCheck.ok) return typeCheck.response

    const { published, metadata: rawMetadata, ...base } = parsed.data
    const metadata = validateItemMetadata(rawMetadata ?? null, portfolio.type)
    if (!metadata.ok) return metadata.response

    // Per-locale text overrides: validate through Zod (length caps), then
    // persist once the item id exists. Only the fields the editor renders for
    // this portfolio type are collected/persisted.
    const localizedFields = portfolioItemLocalizedFieldsFor(portfolio.type)
    const localized = collectLocalizedItemText(form, localizedFields)
    const localizedCheck = validateLocalizedItemText(localized, localizedFields)
    if (!localizedCheck.ok) return localizedCheck.response

    const maxOrder = db
      .select({ order: schema.portfolioItems.order })
      .from(schema.portfolioItems)
      .where(eq(schema.portfolioItems.portfolioId, portfolioId))
      .orderBy(desc(schema.portfolioItems.order))
      .limit(1)
      .get()

    const inserted = db.insert(schema.portfolioItems)
      .values({
        ...base,
        metadata: metadata.value,
        published: published === 'on',
        order: maxOrder?.order != null ? maxOrder.order + 1 : 0,
        portfolioId
      })
      .returning({ id: schema.portfolioItems.id })
      .get()

    persistItemLocalizedText(inserted.id, localized, {}, localizedFields)

    redirect(303, ADMIN_ROUTES.portfolioItems(portfolioId))
  },

  /** Update an item (full-field form — the modal always submits every field). */
  update: async event => {
    requireAdminPage(event, 'portfolios')
    const portfolioId = Number(event.params.id)
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = updateItemSchema.safeParse({
      id: form.get('id'),
      itemType: form.get('itemType'),
      mediaUrl: form.get('mediaUrl') || null,
      thumbnailUrl: form.get('thumbnailUrl') || null,
      caption: form.get('caption') || null,
      title: form.get('title') || null,
      description: form.get('description') || null,
      content: form.get('content') || null,
      metadata: form.get('metadata') || undefined,
      published: form.get('published') || null
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()
    const portfolio = db
      .select()
      .from(schema.portfolios)
      .where(eq(schema.portfolios.id, portfolioId))
      .get()
    if (!portfolio) error(404)
    const existing = db
      .select()
      .from(schema.portfolioItems)
      .where(
        and(
          eq(schema.portfolioItems.id, parsed.data.id),
          eq(schema.portfolioItems.portfolioId, portfolioId)
        )
      )
      .get()
    if (!existing) return fail(404, { fieldErrors: { id: ['admin.portfolioItemNotFound'] } })

    const typeCheck = validateItemType(parsed.data.itemType, portfolio.type, existing.itemType)
    if (!typeCheck.ok) return typeCheck.response

    const { id, published, metadata: rawMetadata, ...base } = parsed.data
    const metadata = validateItemMetadata(rawMetadata ?? null, portfolio.type)
    if (!metadata.ok) return metadata.response

    // Per-locale text overrides: validate through Zod (length caps) and only
    // collect/persist the fields the editor renders for this portfolio type
    // (an unrendered field must never trigger the clear-on-empty branch).
    const localizedFields = portfolioItemLocalizedFieldsFor(portfolio.type)
    const localized = collectLocalizedItemText(form, localizedFields)
    const localizedCheck = validateLocalizedItemText(localized, localizedFields)
    if (!localizedCheck.ok) return localizedCheck.response

    // NO-OP metadata guard (review fix): an admin save whose metadata matches
    // the enriched runtime baseline (e.g. the cover-only gallery folded by the
    // PM2 enrichment) must NOT persist that fold with the admin-edit marker —
    // doing so would bake the single-cover array into the row and permanently
    // block --gallery-repair / the runtime enrichment from reconstructing the
    // full gallery. An unchanged payload keeps the STORED metadata; only a
    // real edit (or an intentional clear) is marked and written.
    const enrichedBaseline = enrichPortfolioItemsFromSource([existing], portfolio.type)[0]
    const baselineMetadata = enrichedBaseline?.metadata ?? existing.metadata
    const metadataUnchanged =
      metadata.raw != null && baselineMetadata != null
        ? metadataDeepEqual(metadata.raw, baselineMetadata)
        : metadata.raw === baselineMetadata
    const metadataToWrite = metadataUnchanged ? existing.metadata : metadata.value

    db.update(schema.portfolioItems)
      .set({
        ...base,
        metadata: metadataToWrite,
        published: published === 'on'
      })
      .where(
        and(eq(schema.portfolioItems.id, id), eq(schema.portfolioItems.portfolioId, portfolioId))
      )
      .run()

    // Persist per-locale text overrides; an empty override that previously
    // carried a translation clears it (falling back to the column).
    const previous = getPortfolioItemTranslations([id]).get(id) ?? {}
    persistItemLocalizedText(id, localized, previous, localizedFields)

    redirect(303, ADMIN_ROUTES.portfolioItems(portfolioId))
  },

  /** Delete an item. */
  delete: async event => {
    requireAdminPage(event, 'portfolios')
    const portfolioId = Number(event.params.id)
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = idSchema.safeParse({ id: form.get('id') })
    if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })

    const db = useDatabase()
    const existing = db
      .select()
      .from(schema.portfolioItems)
      .where(
        and(
          eq(schema.portfolioItems.id, parsed.data.id),
          eq(schema.portfolioItems.portfolioId, portfolioId)
        )
      )
      .get()
    if (!existing) return fail(404, { fieldErrors: { id: ['admin.portfolioItemNotFound'] } })
    db.delete(schema.portfolioItems)
      .where(
        and(
          eq(schema.portfolioItems.id, parsed.data.id),
          eq(schema.portfolioItems.portfolioId, portfolioId)
        )
      )
      .run()

    // Remove the orphaned per-locale translation rows for the deleted item.
    const previous = getPortfolioItemTranslations([existing.id]).get(existing.id) ?? {}
    for (const locale of NON_DEFAULT_LOCALES) {
      const keys = Object.keys(previous[locale] ?? {})
        .map(field => `portfolio_item.${existing.id}.${field}`)
      if (keys.length > 0) deleteTranslations(locale, keys)
    }
    invalidateContentCache()

    redirect(303, ADMIN_ROUTES.portfolioItems(portfolioId))
  },

  /** Reorder: swap this item with its sibling atomically (order delta ±1). */
  move: async event => {
    requireAdminPage(event, 'portfolios')
    const portfolioId = Number(event.params.id)
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = moveSchema.safeParse({ id: form.get('id'), dir: form.get('dir') })
    if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })

    const db = useDatabase()
    const existing = db
      .select()
      .from(schema.portfolioItems)
      .where(
        and(
          eq(schema.portfolioItems.id, parsed.data.id),
          eq(schema.portfolioItems.portfolioId, portfolioId)
        )
      )
      .get()
    if (!existing) return fail(404, { fieldErrors: { id: ['admin.portfolioItemNotFound'] } })

    db.transaction(() => {
      const siblings = db
        .select({ id: schema.portfolioItems.id, order: schema.portfolioItems.order })
        .from(schema.portfolioItems)
        .where(eq(schema.portfolioItems.portfolioId, portfolioId))
        .orderBy(asc(schema.portfolioItems.order))
        .all()

      const sorted = [...siblings]
        .map(s => ({ id: s.id, order: s.order ?? 0 }))
        .sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex(s => s.id === parsed.data.id)
      if (idx < 0) throw error(404)
      const targetIdx = idx + parsed.data.dir
      if (targetIdx < 0 || targetIdx >= sorted.length) throw error(400)
      const target = sorted[targetIdx]
      if (!target) throw error(400)
      const a = target.order
      const b = existing.order ?? 0

      db.update(schema.portfolioItems)
        .set({ order: a })
        .where(eq(schema.portfolioItems.id, parsed.data.id))
        .run()
      db.update(schema.portfolioItems)
        .set({ order: b })
        .where(eq(schema.portfolioItems.id, target.id))
        .run()
    })

    redirect(303, ADMIN_ROUTES.portfolioItems(portfolioId))
  }
}
