import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { sql } from 'drizzle-orm'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase } from '$lib/server/db'

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'health')
  const db = useDatabase()
  const result = db.run(sql`SELECT 1 as ok`)
  const dbOk = result.changes >= 0
  return json(jsonSuccess({
    status: 'ok',
    database: dbOk ? 'connected' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version
  }))
}
