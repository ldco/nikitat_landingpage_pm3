import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

const updateSchema = z.record(z.string(), z.string())

export async function PUT(event: RequestEvent) {
  requireAdmin(event)
  const locale = event.params.locale
  if (!['ru', 'en', 'fr', 'he'].includes(locale!)) throw error(400, 'Invalid locale')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400, 'Invalid request body')
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  let count = 0
  for (const [key, value] of Object.entries(parsed.data)) {
    const existing = db.select().from(schema.translations)
      .where(and(eq(schema.translations.locale, locale!), eq(schema.translations.key, key)))
      .get()
    if (existing) {
      db.update(schema.translations).set({ value, updatedAt: new Date() })
        .where(eq(schema.translations.id, existing.id)).run()
      count++
    }
  }
  return json(jsonSuccess({ updated: count }))
}
