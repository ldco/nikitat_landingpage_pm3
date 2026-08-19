import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { schema } from '$lib/server/db'
import { slugSchema } from '$lib/server/utils/validation'
import {
  apiGetEntity,
  apiUpdateEntity,
  apiDeleteEntity,
  type SimpleEntitySpec
} from '$lib/server/services/entity-crud'

const blogSpec: SimpleEntitySpec<typeof schema.blogPosts> = {
  table: schema.blogPosts,
  idColumn: schema.blogPosts.id,
  adminPage: 'blog'
}

const updateSchema = z.object({
  slug: slugSchema.optional(),
  categoryId: z.number().int().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  published: z.boolean().optional()
})

export function GET(event: RequestEvent) {
  return apiGetEntity(event, blogSpec)
}

export function PUT(event: RequestEvent) {
  return apiUpdateEntity(event, blogSpec, updateSchema)
}

export function DELETE(event: RequestEvent) {
  return apiDeleteEntity(event, blogSpec)
}
