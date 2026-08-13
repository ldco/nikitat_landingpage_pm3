import { error, fail, redirect } from '@sveltejs/kit'
import { eq, desc, asc, and } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { normalizeItemMetadata } from '$lib/portfolio-metadata'
import type { PageServerLoad, Actions } from './$types'

/**
 * Parse + validate the `metadata` form field (a JSON string) against the
 * portfolio's per-type schema via the shared adapter. Returns the validated
 * JSON string to store, or a fail() response for invalid payloads. Empty
 * metadata stores null.
 */
function validateItemMetadata(
  raw: FormDataEntryValue | null,
  portfolioType: string
): { ok: true; value: string | null } | { ok: false; response: ReturnType<typeof fail> } {
  if (!raw) return { ok: true, value: null }
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
  return { ok: true, value: normalized }
}

const createItemSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']),
  mediaUrl: z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
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

  const items = db
    .select()
    .from(schema.portfolioItems)
    .where(eq(schema.portfolioItems.portfolioId, portfolioId))
    .orderBy(schema.portfolioItems.order)
    .all()

  return { portfolio, items }
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

    const { published, metadata: rawMetadata, ...base } = parsed.data
    const metadata = validateItemMetadata(rawMetadata ?? null, portfolio.type)
    if (!metadata.ok) return metadata.response

    const maxOrder = db
      .select({ order: schema.portfolioItems.order })
      .from(schema.portfolioItems)
      .where(eq(schema.portfolioItems.portfolioId, portfolioId))
      .orderBy(desc(schema.portfolioItems.order))
      .limit(1)
      .get()

    db.insert(schema.portfolioItems)
      .values({
        ...base,
        metadata: metadata.value,
        published: published === 'on',
        order: maxOrder?.order != null ? maxOrder.order + 1 : 0,
        portfolioId
      })
      .run()

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

    const { id, published, metadata: rawMetadata, ...base } = parsed.data
    const metadata = validateItemMetadata(rawMetadata ?? null, portfolio.type)
    if (!metadata.ok) return metadata.response
    db.update(schema.portfolioItems)
      .set({
        ...base,
        metadata: metadata.value,
        published: published === 'on'
      })
      .where(
        and(eq(schema.portfolioItems.id, id), eq(schema.portfolioItems.portfolioId, portfolioId))
      )
      .run()

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
