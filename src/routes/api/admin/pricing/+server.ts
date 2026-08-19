import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { slugSchema } from '$lib/server/utils/validation'
import {
  PRICING_CURRENCIES,
  PRICING_PERIODS,
  PRICING_DEFAULT_CURRENCY,
  PRICING_DEFAULT_PERIOD,
  PRICING_DEFAULT_CTA_URL
} from '$lib/pricing-constants'
import {
  apiListEntities,
  type SimpleEntitySpec
} from '$lib/server/services/entity-crud'

const pricingSpec: SimpleEntitySpec<typeof schema.pricingTiers> = {
  table: schema.pricingTiers,
  idColumn: schema.pricingTiers.id,
  adminPage: 'pricing'
}

const createSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  price: z.number().int().nullable().optional(),
  currency: z.enum(PRICING_CURRENCIES).optional().default(PRICING_DEFAULT_CURRENCY),
  period: z.enum(PRICING_PERIODS).optional().default(PRICING_DEFAULT_PERIOD),
  featured: z.boolean().optional().default(false),
  ctaText: z.string().nullable().optional(),
  ctaUrl: z.string().optional().default(PRICING_DEFAULT_CTA_URL),
  published: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0)
})

export function GET(event: RequestEvent) {
  return apiListEntities(event, pricingSpec)
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'pricing')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const result = db.insert(schema.pricingTiers).values(parsed.data).returning().get()
  return json(jsonSuccess(result))
}
