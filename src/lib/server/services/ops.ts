/**
 * Ops Agent proxy helpers — shared between the /api/admin/ops route and the
 * admin health page.
 *
 * The sidecar (scripts/ops-agent.mjs) uses hyphenated action ids
 * (db-backup, db-integrity, restart-app); the public admin API keeps
 * underscore names. Translation is applied here so every proxied action
 * reaches the sidecar with an identifier it recognizes.
 */
export type OpsAction = 'restart' | 'flush_cache' | 'rotate_logs' | 'db_backup' | 'db_integrity'

export const ALLOWED_OPS_ACTIONS: OpsAction[] = ['restart', 'flush_cache', 'rotate_logs', 'db_backup', 'db_integrity']

/**
 * Public admin API action names → sidecar identifiers (scripts/ops-agent.mjs
 * actionDefinitions). Local actions (flush_cache, rotate_logs) are never
 * proxied; their mapping is identity and only used for bookkeeping.
 */
export const OPS_ACTION_TO_SIDECAR: Record<OpsAction, string> = {
  restart: 'restart-app',
  flush_cache: 'flush_cache',
  rotate_logs: 'rotate_logs',
  db_backup: 'db-backup',
  db_integrity: 'db-integrity'
}

/**
 * Ops agent configuration. The agent is an internal-only sidecar with Docker
 * socket access (scripts/ops-agent.mjs); the app reaches it over the private
 * Docker network. Gating follows .env.example: PM_OPS_AGENT_ENABLED toggles the
 * feature, and the shared token defaults to the settings encryption key.
 */
export function opsAgentConfig() {
  const enabled = process.env.PM_OPS_AGENT_ENABLED === 'true'
  const port = process.env.PM_OPS_AGENT_PORT || '3010'
  const host = process.env.PM_OPS_AGENT_HOST || 'ops-agent'
  const token = process.env.PM_OPS_AGENT_TOKEN || process.env.PM_SETTINGS_ENCRYPTION_KEY || ''
  return { enabled, baseUrl: `http://${host}:${port}`, token }
}

export function opsUnavailableResponse() {
  return {
    success: false,
    error: { code: 'ops.unavailable', message: 'PM_OPS_AGENT_ENABLED / PM_OPS_AGENT_TOKEN not configured' }
  }
}
