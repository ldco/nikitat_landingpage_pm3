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

const featuresSpec: SimpleEntitySpec<typeof schema.features> = {
  table: schema.features,
  idColumn: schema.features.id,
  adminPage: 'features'
}

const createSchema = z.object({
  slug: slugSchema,
  imageUrl: z.string().nullable().optional(),
  hoverImageUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  published: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0)
})

export function GET(event: RequestEvent) {
  return apiListEntities(event, featuresSpec)
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'features')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.features).values(parsed.data).returning().get()
  return json(jsonSuccess(result))
}
