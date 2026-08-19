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

const featuresSpec: SimpleEntitySpec<typeof schema.features> = {
  table: schema.features,
  idColumn: schema.features.id,
  adminPage: 'features'
}

const updateSchema = z.object({
  slug: slugSchema.optional(),
  imageUrl: z.string().nullable().optional(),
  hoverImageUrl: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  published: z.boolean().optional(),
  order: z.number().int().optional()
})

export function GET(event: RequestEvent) {
  return apiGetEntity(event, featuresSpec)
}

export function PUT(event: RequestEvent) {
  return apiUpdateEntity(event, featuresSpec, updateSchema)
}

export function DELETE(event: RequestEvent) {
  return apiDeleteEntity(event, featuresSpec)
}
