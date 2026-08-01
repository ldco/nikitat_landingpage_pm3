import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { logger } from '$lib/server/utils/logger'
import { execSync } from 'node:child_process'

const ALLOWED_COMMANDS = [
  'df -h',
  'free -m',
  'uptime',
  'whoami',
  'id',
  'pwd',
  'ls -la',
  'ps aux',
  'netstat -tlnp',
  'ss -tlnp',
  'cat /etc/os-release'
]

const commandSchema = z.object({
  command: z.string().min(1).max(200)
})

export async function POST(event: RequestEvent) {
  const actor = requireMaster(event)
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)
  const parsed = commandSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const cmd = parsed.data.command.trim()
  const allowed = ALLOWED_COMMANDS.some(ac => cmd.startsWith(ac))
  if (!allowed) error(403)
  try {
    const output = execSync(cmd, { timeout: 10000, encoding: 'utf-8' })
    const ip = getClientIp(event.request)
    const ua = event.request.headers.get('user-agent')
    // audit via logger for now
    logger.info({ cmd, actor: actor.id }, 'Terminal command executed')
    return json(jsonSuccess({ output, command: cmd }))
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return json(jsonSuccess({ output: `Error: ${message}`, command: cmd }))
  }
}
