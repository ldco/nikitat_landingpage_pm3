import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = (event) => {
  requireAdmin(event)
  const db = useDatabase()
  const items = db.select({ id: schema.translations.id, key: schema.translations.key, locale: schema.translations.locale, value: schema.translations.value }).from(schema.translations).limit(100).all()
  return { items }
}
