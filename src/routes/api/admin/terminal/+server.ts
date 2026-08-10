import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess, apiError } from '$lib/server/utils/api'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'
import { logger } from '$lib/server/utils/logger'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

// audit N-6: async exec (non-blocking) instead of execSync so a long-running
// allowlisted command never stalls the event loop.
const execAsync = promisify(exec)

const ALLOWED_COMMANDS = new Set([
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
])

const commandSchema = z.object({
  command: z.string().min(1).max(200)
})

export async function POST(event: RequestEvent) {
  const actor = requireMaster(event)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = commandSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const cmd = parsed.data.command.trim()
  if (!ALLOWED_COMMANDS.has(cmd)) throw error(403)

  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')

  try {
    const { stdout } = await execAsync(cmd, { timeout: 10000, encoding: 'utf-8' })
    audit.terminalCommand(ip, ua, actor.id, cmd, true)
    logger.info({ cmd, actor: actor.id, ip, ua }, 'Terminal command executed')
    return json(jsonSuccess({ output: stdout, command: cmd }))
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e)
    audit.terminalCommand(ip, ua, actor.id, cmd, false)
    logger.error({ cmd, actor: actor.id, error: errMsg }, 'Terminal command failed')
    apiError(500, 'terminal.execution_failed', 'Command execution failed')
  }
}
