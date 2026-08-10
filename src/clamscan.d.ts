/**
 * Ambient type declaration for the optional `clamscan` package.
 *
 * clamscan is an OPTIONAL runtime dependency used only by
 * src/lib/server/utils/virus-scanning.ts (audit I-2 hardening). It is not
 * installed by default; the scanner degrades gracefully to fail-open when the
 * package or ClamAV daemon is absent. This declaration keeps TypeScript happy
 * without forcing the package into the dependency tree.
 */
declare module 'clamscan' {
  interface ClamScanInstance {
    scanBuffer(buffer: Buffer, timeout?: number, filename?: string): Promise<{ isInfected: boolean; viruses: string[] }>
    getVersion(): Promise<string>
  }

  interface ClamScanOptions {
    clamdscan?: {
      socket?: string
      timeout?: number
      localFallback?: boolean
    }
    preference?: 'clamdscan' | 'clamscan'
  }

  class NodeClam {
    init(options?: ClamScanOptions): Promise<ClamScanInstance>
  }

  export default NodeClam
}
