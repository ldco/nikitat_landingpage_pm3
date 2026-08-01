import { json } from '@sveltejs/kit'
import { getAdminTranslations } from '$lib/server/db/translations-cache'
import type { RequestEvent } from '@sveltejs/kit'

export function GET(event: RequestEvent) {
  // Use ?locale= query param, fallback to ru
  const locale = event.url.searchParams.get('locale') || 'ru'
  const t = getAdminTranslations(locale)
  return json(t)
}
