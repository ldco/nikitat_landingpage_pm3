import { json } from '@sveltejs/kit'
import { z } from 'zod'
import { upsertLegalDocument, deleteLegalDocument } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { localeSchema } from '$lib/server/utils/validation'
import { LEGAL_DOCUMENT_SLUGS } from '$lib/server/db/seed-data/legal'
import type { RequestEvent } from '@sveltejs/kit'

const updateSchema = z.object({
  locale: localeSchema,
  content: z.string()
})

/** PUT /api/admin/legal/:slug — upsert document content for a locale. */
export async function PUT(event: RequestEvent) {
  requireAdminPage(event, 'legal')
  const slug = event.params.slug ?? ''
  if (!LEGAL_DOCUMENT_SLUGS.includes(slug as (typeof LEGAL_DOCUMENT_SLUGS)[number])) {
    return json({ success: false, error: { code: 'not_found', message: 'Unknown document' } }, { status: 404 })
  }
  const body = await event.request.json().catch(() => null)
  if (!body) return json({ success: false, error: { code: 'invalid_body', message: 'Invalid body' } }, { status: 400 })
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return json({ success: false, error: { code: 'validation', message: parsed.error.issues.map(e => e.message).join(', ') } }, { status: 400 })
  }
  upsertLegalDocument(slug, parsed.data.locale, parsed.data.content)
  return json(jsonSuccess({ slug, locale: parsed.data.locale }))
}

/** DELETE /api/admin/legal/:slug?locale= — reset a document to filesystem default. */
export async function DELETE(event: RequestEvent) {
  requireAdminPage(event, 'legal')
  const slug = event.params.slug ?? ''
  if (!LEGAL_DOCUMENT_SLUGS.includes(slug as (typeof LEGAL_DOCUMENT_SLUGS)[number])) {
    return json({ success: false, error: { code: 'not_found', message: 'Unknown document' } }, { status: 404 })
  }
  const parsed = localeSchema.safeParse(event.url.searchParams.get('locale'))
  if (!parsed.success) {
    return json({ success: false, error: { code: 'validation', message: 'Invalid locale' } }, { status: 400 })
  }
  deleteLegalDocument(slug, parsed.data)
  return json(jsonSuccess({ slug, locale: parsed.data }))
}
