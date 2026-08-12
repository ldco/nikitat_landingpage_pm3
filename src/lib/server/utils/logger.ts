/**
 * Logger — Pino-based structured logger with an in-memory ring buffer
 *
 * PM2 monitoring.md parity: "Ring buffer keeps last N log entries in RAM"
 * (LOG_BUFFER_SIZE = 500). Every log line written through this logger is
 * captured in the ring buffer so GET /api/admin/logs can serve recent logs
 * without reading files synchronously. The buffer is bounded and overwrites
 * oldest entries.
 *
 * The logMethod hook captures the NORMALIZED record — the object merged with
 * the rendered message and the numeric level — not just the first argument.
 * Both `logger.info('text')` and `logger.error({ context: 'x' }, 'message')`
 * therefore retain `time`, `level`, and the final message string.
 */
import pino from 'pino'

export const LOG_BUFFER_SIZE = 500

export interface LogBufferEntry {
  time: number
  level: number
  msg: string
  [key: string]: unknown
}

const ringBuffer: LogBufferEntry[] = []

function pushToBuffer(entry: LogBufferEntry): void {
  ringBuffer.push(entry)
  if (ringBuffer.length > LOG_BUFFER_SIZE) ringBuffer.splice(0, ringBuffer.length - LOG_BUFFER_SIZE)
}

export function getLogBufferEntries(): LogBufferEntry[] {
  return [...ringBuffer]
}

/** Number of entries currently retained (used by the health log-buffer probe). */
export function getLogBufferSize(): number {
  return ringBuffer.length
}

/** Return the last N entries, oldest first (bounded tail — never a full-file read). */
export function getRecentLogs(lines: number): LogBufferEntry[] {
  const tail = lines > 0 ? ringBuffer.slice(-lines) : ringBuffer.slice()
  return tail
}

/**
 * Build the normalized buffer entry from pino's raw log-method arguments.
 *
 * Supported call shapes (pino LogFn):
 *   - logger.info('text')                       → msg='text', no context
 *   - logger.error({ context: 'x' }, 'message') → context + msg='message'
 *   - logger.info({ msg: 'x' })                 → msg='x' (object-only)
 *
 * `level` is the numeric level passed by pino to the hook (10..60).
 */
function normalizeEntry(args: Parameters<pino.LogFn>, level: number): LogBufferEntry {
  const [first, second, ...rest] = args
  const obj = first
  const rawMsg = second

  let msg: string
  if (typeof rawMsg === 'string') {
    msg = rawMsg
  } else if (typeof obj === 'string') {
    msg = obj
  } else if (obj && typeof obj === 'object' && typeof (obj as { msg?: unknown }).msg === 'string') {
    msg = (obj as { msg: string }).msg
  } else {
    // Unstructured payload — stringify deterministically.
    msg = JSON.stringify(obj ?? rawMsg)
  }

  const entry: LogBufferEntry = {
    time: Date.now(),
    level,
    msg,
    ...(obj && typeof obj === 'object' ? { ...obj as Record<string, unknown> } : {}),
    ...(rest.length ? { args: rest } : {})
  }
  // The message must always reflect the rendered (final) string.
  entry.msg = msg
  return entry
}

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  hooks: {
    // Capture the normalized record (object + message + numeric level) into
    // the ring buffer; the original method still emits to stdout.
    logMethod(inputArgs, method, level) {
      pushToBuffer(normalizeEntry(inputArgs, level))
      return method.apply(this, inputArgs as [obj: unknown, msg?: string, ...args: unknown[]])
    }
  }
})
