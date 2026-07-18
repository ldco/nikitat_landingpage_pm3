import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getPaginationParams } from '$lib/server/utils/pagination'

const createTranslationSchema = z.object({
  locale: z.enum(['ru', 'en', 'fr', 'he']),
  key: z.string().min(1).max(255),
  value: z.string()
})

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const locale = event.url.searchParams.get('locale')
  let query: any = db.select().from(schema.translations)
  if (locale) query = query.where(eq(schema.translations.locale, locale))
  const all = query.limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.translations.id }).from(schema.translations).all().length
  return json({ success: true, data: all, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}

export async function POST(event: RequestEvent) {
  requireAdmin(event)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400, 'Invalid request body')
  const parsed = createTranslationSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.translations).values(parsed.data).returning().get()
  return json(jsonSuccess(result))
}
