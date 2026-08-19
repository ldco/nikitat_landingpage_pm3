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

const faqSpec: SimpleEntitySpec<typeof schema.faqItems> = {
  table: schema.faqItems,
  idColumn: schema.faqItems.id,
  adminPage: 'faq'
}

const updateSchema = z.object({
  slug: slugSchema.optional(),
  category: z.string().nullable().optional(),
  published: z.boolean().optional(),
  order: z.number().int().optional()
})

export function GET(event: RequestEvent) {
  return apiGetEntity(event, faqSpec)
}

export function PUT(event: RequestEvent) {
  return apiUpdateEntity(event, faqSpec, updateSchema)
}

export function DELETE(event: RequestEvent) {
  return apiDeleteEntity(event, faqSpec)
}
