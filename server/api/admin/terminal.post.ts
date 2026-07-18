/**
 * Admin Terminal Endpoint
 *
 * POST /api/admin/terminal
 *
 * Runs a constrained set of read-only diagnostics commands for the admin
 * system page terminal emulator. Requires master role.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { z } from 'zod'
import { requireAdminSectionAccess, type RbacUser } from '../../utils/admin-rbac'
import { allowedTerminalCommands } from '../../utils/admin-terminal'
import { audit } from '../../utils/audit'

const execFileAsync = promisify(execFile)

const terminalCommandSchema = z.object({
  command: z.string().trim().min(1).max(120)
})

function normalizeOutput(stdout: string, stderr: string): string {
  const combined = [stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join('\n')
  return combined || '(no output)'
}

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const parsed = terminalCommandSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid terminal command'
    })
  }

  const command = parsed.data.command
  const allowedCommand = allowedTerminalCommands[command]
  if (!allowedCommand) {
    await audit.terminalCommand(event, user.id, command, false)
    throw createError({
      statusCode: 400,
      message: 'Command is not allowed'
    })
  }

  const startedAt = new Date().toISOString()
  const startTime = Date.now()

  try {
    if (allowedCommand.output) {
      const output = await allowedCommand.output()
      await audit.terminalCommand(event, user.id, command, true)
      return {
        success: true,
        data: {
          command,
          output,
          exitCode: 0,
          durationMs: Date.now() - startTime,
          startedAt
        }
      }
    }

    if (!allowedCommand.file) {
      throw createError({ statusCode: 500, message: 'Command misconfigured: no file' })
    }
    const result = await execFileAsync(allowedCommand.file, allowedCommand.args || [], {
      cwd: process.cwd(),
      timeout: 5000,
      maxBuffer: 64 * 1024,
      shell: false
    })

    await audit.terminalCommand(event, user.id, command, true)
    return {
      success: true,
      data: {
        command,
        output: normalizeOutput(result.stdout, result.stderr),
        exitCode: 0,
        durationMs: Date.now() - startTime,
        startedAt
      }
    }
  } catch (error: unknown) {
    const execError = error as {
      stdout?: string
      stderr?: string
      code?: number
      signal?: string
      message?: string
    }

    await audit.terminalCommand(event, user.id, command, false)
    return {
      success: true,
      data: {
        command,
        output: normalizeOutput(
          execError.stdout || '',
          execError.stderr || execError.message || execError.signal || 'Command failed'
        ),
        exitCode: typeof execError.code === 'number' ? execError.code : 1,
        durationMs: Date.now() - startTime,
        startedAt
      }
    }
  }
})
