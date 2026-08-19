import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { slugSchema } from '$lib/server/utils/validation'
import {
  apiListEntities,
  type SimpleEntitySpec
} from '$lib/server/services/entity-crud'

const faqSpec: SimpleEntitySpec<typeof schema.faqItems> = {
  table: schema.faqItems,
  idColumn: schema.faqItems.id,
  adminPage: 'faq'
}

const createSchema = z.object({
  slug: slugSchema,
  category: z.string().nullable().optional(),
  published: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0)
})

export function GET(event: RequestEvent) {
  return apiListEntities(event, faqSpec)
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'faq')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.faqItems).values(parsed.data).returning().get()
  return json(jsonSuccess(result))
}
