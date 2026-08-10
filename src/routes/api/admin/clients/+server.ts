import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getAdminClients } from '$lib/server/services/clients'

/**
 * Reject executable/dangerous URL schemes. Logo and website values end up in
 * public <img src> / <a href> attributes, so only relative paths (site
 * uploads) and http(s) URLs are allowed; inline data: images are allowed for
 * logos only. javascript:/vbscript:/data:text are rejected outright.
 */
const httpOrRelativeUrl = (field: string) =>
  z.string().max(500).refine(
    v => v === '' || /^(https?:\/\/|\/)/i.test(v),
    `${field} must be an absolute http(s) URL or a site-relative path`
  )

export const _createClientSchema = z.object({
  name: z.string().min(1).max(200),
  logoUrl: z.string().max(500).refine(
    v => /^(https?:\/\/|\/|data:image\/)/i.test(v),
    'logoUrl must be an http(s) URL, a site-relative path, or an inline image'
  ),
  websiteUrl: httpOrRelativeUrl('websiteUrl').nullish(),
  category: z.enum(['client', 'sponsor', 'partner']).nullish(),
  featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true)
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'clients')
  return json(jsonSuccess(getAdminClients()))
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'clients')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = _createClientSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const db = useDatabase()
  const item = db.insert(schema.clients).values(parsed.data).returning().get()
  return json(jsonSuccess({ id: item.id }))
}
