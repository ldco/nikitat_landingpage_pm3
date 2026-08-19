import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { schema } from '$lib/server/db'
import { logger } from '$lib/server/utils/logger'
import { getTableCount } from '$lib/server/utils/pagination'

export function GET(event: RequestEvent) {
  requireMaster(event)
  const bundle = {
    generatedAt: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    stats: {
      users: getTableCount(schema.users),
      settings: getTableCount(schema.settings),
      auditLogs: getTableCount(schema.auditLogs)
    }
  }
  logger.info({ actor: event.locals.user?.id }, 'Support bundle exported')
  return json(jsonSuccess(bundle))
}
