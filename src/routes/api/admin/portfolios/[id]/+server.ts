import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { updatePortfolio } from '$lib/server/services/portfolio-admin'

const updateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  type: z.enum(['gallery', 'case_study', 'branding', 'brandbook', 'website']).optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.boolean().optional()
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const db = useDatabase()
  const id = Number(event.params.id)
  const item = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, id)).get()
  if (!item) throw error(404)
  return json(jsonSuccess(item))
}

export async function PUT(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const id = Number(event.params.id)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  // Shared admin service: the API PUT runs the SAME type-change guard, item
  // metadata migration, transaction handling and duplicate-slug mapping as
  // the page action (/admin/portfolios/[id]/edit) — the two admin surfaces
  // can never drift.
  const result = updatePortfolio(id, parsed.data)
  if (!result.ok) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'validation.portfolio',
        message: 'Portfolio update failed',
        details: { fieldErrors: result.fieldErrors }
      }
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    })
  }

  const db = useDatabase()
  const updated = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, id)).get()
  if (!updated) throw error(404)
  return json(jsonSuccess(updated))
}

export async function DELETE(event: RequestEvent) {
  requireAdminPage(event, 'portfolios')
  const id = Number(event.params.id)
  const db = useDatabase()
  const existing = db.select().from(schema.portfolios).where(eq(schema.portfolios.id, id)).get()
  if (!existing) throw error(404)
  db.delete(schema.portfolios).where(eq(schema.portfolios.id, id)).run()
  return json(jsonSuccess({ deleted: true }))
}
