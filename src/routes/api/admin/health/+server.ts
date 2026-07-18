import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireAdmin } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase } from '$lib/server/db'

export function GET(event: RequestEvent) {
  requireAdmin(event)
  const db = useDatabase()
  const dbOk = db.run('SELECT 1 as ok').changes >= 0
  return json(jsonSuccess({
    status: 'ok',
    database: dbOk ? 'connected' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version
  }))
}
