/**
 * Virus Scanning (optional — audit I-2 hardening)
 *
 * Uses ClamAV via the clamscan package to scan uploaded files for malware.
 * Env-gated and fail-open: when disabled or when ClamAV is unavailable, uploads
 * proceed unscanned (magic-byte validation still applies). This keeps uploads
 * working in environments without ClamAV while allowing hardening on servers
 * that provide it.
 *
 * Env:
 *   - CLAMAV_ENABLED: 'true' to force enable; defaults to enabled in
 *     production, disabled in dev (unless explicitly 'true').
 *   - CLAMAV_SOCKET: clamd socket path (default /var/run/clamav/clamd.ctl)
 *
 * Current config context: uploads are admin-only (requireAdmin) and
 * MODULES.contact is disabled — there is no public upload surface, so this is
 * optional hardening, not a blocking requirement.
 */
import { createRequire } from 'node:module'
import { logger } from '$lib/server/utils/logger'

const require = createRequire(import.meta.url)

interface ScanResult {
  isInfected: boolean
  viruses?: string[]
  error?: string
}

interface ClamScanInstance {
  scanBuffer(buffer: Buffer, timeout?: number, filename?: string): Promise<{ isInfected: boolean; viruses: string[] }>
}

let clamScanInstance: ClamScanInstance | null = null

function isClamAvEnabled(): boolean {
  const isProduction = process.env.NODE_ENV === 'production'
  const envEnabled = process.env.CLAMAV_ENABLED !== 'false'
  return isProduction ? envEnabled : process.env.CLAMAV_ENABLED === 'true'
}

async function initClamScan(): Promise<ClamScanInstance | null> {
  if (clamScanInstance !== null) {
    return clamScanInstance
  }

  try {
    // createRequire + try/catch keeps clamscan a true OPTIONAL runtime dep —
    // Rollup cannot statically analyze it, so the build succeeds without the
    // package installed. At runtime it resolves only when CLAMAV is enabled.
    const NodeClam = require('clamscan') as {
      default?: new () => { init(options?: unknown): Promise<ClamScanInstance> }
    }
    const ClamCtor = NodeClam.default ?? (NodeClam as unknown as new () => { init(options?: unknown): Promise<ClamScanInstance> })

    const socketPath = process.env.CLAMAV_SOCKET || '/var/run/clamav/clamd.ctl'

    const instance = await new ClamCtor().init({
      clamdscan: {
        socket: socketPath,
        timeout: 60000,
        localFallback: false
      },
      preference: 'clamdscan'
    })

    clamScanInstance = instance
    logger.info({ socket: socketPath }, 'ClamAV initialized successfully')
    return instance
  } catch (error: unknown) {
    logger.warn({ error: error instanceof Error ? error.message : String(error) }, 'ClamAV not available - virus scanning disabled')
    return null
  }
}

/**
 * Scan a file buffer for viruses. Fail-open: returns isInfected:false when
 * scanning is disabled or the scanner is unavailable (upload proceeds).
 */
export async function scanFileForViruses(buffer: Buffer, filename: string): Promise<ScanResult> {
  if (!isClamAvEnabled()) {
    return { isInfected: false }
  }

  const clam = await initClamScan()
  if (!clam) {
    logger.warn({ filename }, 'ClamAV unavailable - file uploaded without virus scan')
    return { isInfected: false, error: 'Scanner unavailable' }
  }

  const { isInfected, viruses } = await clam.scanBuffer(buffer, 3000, filename)
  if (isInfected) {
    logger.warn({ filename, viruses }, 'Infected file upload blocked')
  }

  return isInfected ? { isInfected, viruses } : { isInfected: false }
}
