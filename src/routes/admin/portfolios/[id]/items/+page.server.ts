import { error, fail, redirect } from '@sveltejs/kit'
import { eq, desc, asc, and } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import type { PageServerLoad, Actions } from './$types'

const createItemSchema = z.object({
  itemType: z.enum(['image', 'video', 'link', 'case_study']),
  mediaUrl: z.string().optional(),
  caption: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
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
      mediaUrl: form.get('mediaUrl') || undefined,
      caption: form.get('caption') || undefined,
      title: form.get('title') || undefined,
      description: form.get('description') || undefined,
      content: form.get('content') || undefined,
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

    const maxOrder = db
      .select({ order: schema.portfolioItems.order })
      .from(schema.portfolioItems)
      .where(eq(schema.portfolioItems.portfolioId, portfolioId))
      .orderBy(desc(schema.portfolioItems.order))
      .limit(1)
      .get()

    const { published, ...base } = parsed.data
    db.insert(schema.portfolioItems)
      .values({
        ...base,
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
      mediaUrl: form.get('mediaUrl') || undefined,
      caption: form.get('caption') || undefined,
      title: form.get('title') || undefined,
      description: form.get('description') || undefined,
      content: form.get('content') || undefined,
      published: form.get('published') || null
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

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

    const { id, published, ...base } = parsed.data
    db.update(schema.portfolioItems)
      .set({
        ...base,
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
