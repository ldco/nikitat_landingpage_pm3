import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { schema } from '$lib/server/db'
import { slugSchema } from '$lib/server/utils/validation'
import { PRICING_CURRENCIES, PRICING_PERIODS } from '$lib/pricing-constants'
import {
  apiGetEntity,
  apiUpdateEntity,
  apiDeleteEntity,
  type SimpleEntitySpec
} from '$lib/server/services/entity-crud'

const pricingSpec: SimpleEntitySpec<typeof schema.pricingTiers> = {
  table: schema.pricingTiers,
  idColumn: schema.pricingTiers.id,
  adminPage: 'pricing'
}

const updateSchema = z.object({
  slug: slugSchema.optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  price: z.number().int().nullable().optional(),
  currency: z.enum(PRICING_CURRENCIES).optional(),
  period: z.enum(PRICING_PERIODS).optional(),
  featured: z.boolean().optional(),
  ctaText: z.string().nullable().optional(),
  ctaUrl: z.string().optional(),
  published: z.boolean().optional(),
  order: z.number().int().optional()
})

export function GET(event: RequestEvent) {
  return apiGetEntity(event, pricingSpec)
}

export function PUT(event: RequestEvent) {
  return apiUpdateEntity(event, pricingSpec, updateSchema)
}

export function DELETE(event: RequestEvent) {
  return apiDeleteEntity(event, pricingSpec)
}
