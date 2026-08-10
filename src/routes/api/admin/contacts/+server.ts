import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { getSubmissions } from '$lib/server/services'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { paginationSchema } from '$lib/server/utils/validation'

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'contacts')
  const parsed = paginationSchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const { page, pageSize } = parsed.data
  const offset = (page - 1) * pageSize
  const { items, total } = getSubmissions(page, pageSize, offset)
  return json({ success: true, data: items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
}
