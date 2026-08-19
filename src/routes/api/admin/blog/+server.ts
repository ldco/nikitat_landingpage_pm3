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

const blogSpec: SimpleEntitySpec<typeof schema.blogPosts> = {
  table: schema.blogPosts,
  idColumn: schema.blogPosts.id,
  adminPage: 'blog'
}

const createSchema = z.object({
  slug: slugSchema,
  categoryId: z.number().int().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.boolean().optional().default(false)
})

export function GET(event: RequestEvent) {
  return apiListEntities(event, blogSpec)
}

export async function POST(event: RequestEvent) {
  const actor = requireAdminPage(event, 'blog')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  // Publish semantics mirror the create page action: a published post gets a
  // publishedAt timestamp (the public feed orders by desc(publishedAt)) so an
  // API-published post is not pushed to the bottom of the listing.
  const result = db.insert(schema.blogPosts).values({
    ...parsed.data,
    authorId: actor.id,
    publishedAt: parsed.data.published ? new Date() : null
  }).returning().get()
  return json(jsonSuccess(result))
}
