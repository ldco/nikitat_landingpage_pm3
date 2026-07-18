import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { logger } from '$lib/server/utils/logger'

export function GET(event: RequestEvent) {
  requireMaster(event)
  const db = useDatabase()
  const bundle = {
    generatedAt: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    stats: {
      users: db.select({ id: schema.users.id }).from(schema.users).all().length,
      settings: db.select({ id: schema.settings.id }).from(schema.settings).all().length,
      auditLogs: db.select({ id: schema.auditLogs.id }).from(schema.auditLogs).all().length
    }
  }
  logger.info({ actor: event.locals.user?.id }, 'Support bundle exported')
  return json(jsonSuccess(bundle))
}
