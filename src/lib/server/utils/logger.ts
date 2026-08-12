/**
 * Logger — Pino-based structured logger with an in-memory ring buffer
 *
 * PM2 monitoring.md parity: "Ring buffer keeps last N log entries in RAM"
 * (LOG_BUFFER_SIZE = 500). Every log line written through this logger is
 * captured in the ring buffer so GET /api/admin/logs can serve recent logs
 * without reading files synchronously. The buffer is bounded and overwrites
 * oldest entries.
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

function pushToBuffer(obj: unknown): void {
  const entry = (typeof obj === 'object' && obj !== null ? obj : { msg: String(obj) }) as LogBufferEntry
  if (!entry.time) entry.time = Date.now()
  if (typeof entry.msg !== 'string') entry.msg = JSON.stringify(entry.msg ?? entry)
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

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  hooks: {
    // inputArgs: [obj, msg?, ...args]. The object (or string) is captured into
    // the ring buffer; the original method still emits to stdout.
    logMethod(inputArgs, method) {
      pushToBuffer(inputArgs[0])
      return method.apply(this, inputArgs as [obj: unknown, msg?: string, ...args: unknown[]])
    }
  }
})
