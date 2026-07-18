/**
 * Admin Types
 *
 * Types for admin panel pages and API responses.
 * These are database entities and API response types that should be shared.
 */

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Translation entry entity
 */
export interface Translation {
  id: number
  key: string
  value: string
}

/**
 * Translations API response
 */
export interface TranslationsData {
  locales: string[]
  localeNames: Record<string, string>
  content: Record<string, Translation[]>
  system: Record<string, Translation[]> | null
  canEditSystem: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH & MONITORING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Health status values
 */
export type HealthStatus = 'ok' | 'degraded' | 'unhealthy'
export type CheckStatus = 'ok' | 'error' | 'warning'
export type MonitoringStatus = 'ok' | 'warning' | 'error' | 'unavailable'

/**
 * Individual health check result
 */
export interface HealthCheck {
  name: string
  status: CheckStatus
  latency?: number
  message?: string
  details?: Record<string, unknown>
}

/**
 * Overall system health data
 */
export interface HealthData {
  status: HealthStatus
  timestamp: string
  uptime: number
  version: string
  appVersion: string
  buildVersion: string
  buildTimestamp: string
  buildSha: string
  buildBranch: string
  buildCommitMessage: string
  nodeVersion: string
  environment: string
  checks: HealthCheck[]
  responseTime: number
}

export interface MonitoringSeriesPoint {
  timestamp: number
  value: number
}

export interface MonitoringMetric {
  id: string
  label: string
  unit: string
  value: number | null
  status: MonitoringStatus
  chart: string
  dimensions: string[]
  points: MonitoringSeriesPoint[]
  detail?: string
}

export interface MonitoringSummary {
  available: boolean
  source: string
  timestamp: string
  metrics: MonitoringMetric[]
  error?: string
}

export interface OpsContainerStatus {
  name: string
  id: string
  image: string
  state: string
  status: string
  health: string | null
  restartCount: number | null
  startedAt: string | null
}

export interface OpsPathStatus {
  path: string
  exists: boolean
  writable: boolean
  type?: string
  sizeBytes?: number
  error?: string
}

export interface OpsActionDefinition {
  id: string
  label: string
  dangerous: boolean
}

export interface OpsSummary {
  available: boolean
  timestamp?: string
  error?: string
  agent?: {
    host: string
    dockerSocket: boolean
    actions: OpsActionDefinition[]
  }
  containers?: OpsContainerStatus[]
  dockerDisk?: {
    error?: string
    layerBytes: number
    imageBytes: number
    volumeBytes: number
    images: number
    containers: number
    volumes: number
  }
  database?: {
    file: OpsPathStatus
    backupDir: OpsPathStatus
    migrations: {
      expected: number | null
      applied: number | null
      pending: number | null
      lastCreatedAt?: number | null
      error?: string
    }
  }
  storage?: {
    uploads: OpsPathStatus
    temp: OpsPathStatus
  }
}

export interface OpsLogResponse {
  container: 'app' | 'traefik'
  name: string
  output: string
}

export interface OpsActionResult {
  action: string
  result: Record<string, unknown>
}

export interface SupportBundle {
  bundleVersion: number
  generatedAt: string
  generatedBy?: {
    userId: number | null
    role: string | null
  }
  runtime?: Record<string, unknown>
  problemSummary: string[]
  health: HealthData
  monitoring: MonitoringSummary
  operations: OpsSummary | Record<string, unknown>
  appLogs: {
    entries: LogEntry[]
    buffer: Record<string, unknown>
  }
  containerLogs: Record<string, unknown>
  audit: Record<string, unknown>
}

/**
 * Application log entry
 */
export interface LogEntry {
  time: string
  level: number
  levelLabel: string
  msg: string
  context?: Record<string, unknown>
}

/**
 * Terminal command execution result.
 */
export interface TerminalCommandResult {
  command: string
  output: string
  exitCode: number
  durationMs: number
  startedAt: string
}

/**
 * Read-only admin terminal command exposed by the backend-owned manifest.
 */
export interface TerminalCommandOption {
  command: string
  labelKey: string
}

/**
 * Audit trail log entry
 */
export interface AuditLogEntry {
  id: number
  action: string
  userId: number | null
  targetUserId: number | null
  actorName: string | null
  actorEmail: string | null
  ipAddress: string | null
  userAgent: string | null
  details: Record<string, unknown> | null
  success: boolean
  createdAt: string
}
