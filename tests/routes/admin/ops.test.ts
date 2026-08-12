import { describe, it, expect } from 'vitest'
import { OPS_ACTION_TO_SIDECAR } from '$lib/server/services/ops'

/**
 * Route-level tests for the ops proxy sidecar contract (Comment 1).
 *
 * The public admin API action names must be translated to the exact
 * identifiers implemented in scripts/ops-agent.mjs actionDefinitions
 * (hyphenated: db-backup, db-integrity, restart-app) before POSTing.
 */
describe('Ops sidecar action-name translation', () => {
  it('maps every proxied action to the sidecar identifier', () => {
    // Sidecar actionDefinitions (scripts/ops-agent.mjs):
    //   'db-integrity', 'db-backup', 'restart-app', 'restart-traefik'
    expect(OPS_ACTION_TO_SIDECAR.db_backup).toBe('db-backup')
    expect(OPS_ACTION_TO_SIDECAR.db_integrity).toBe('db-integrity')
    expect(OPS_ACTION_TO_SIDECAR.restart).toBe('restart-app')
  })

  it('keeps public admin API names stable (underscore contract)', () => {
    // The public API names are the stable UI contract; translation is internal.
    expect(OPS_ACTION_TO_SIDECAR).toHaveProperty('db_backup')
    expect(OPS_ACTION_TO_SIDECAR).toHaveProperty('db_integrity')
    expect(OPS_ACTION_TO_SIDECAR).toHaveProperty('restart')
    expect(OPS_ACTION_TO_SIDECAR).toHaveProperty('flush_cache')
    expect(OPS_ACTION_TO_SIDECAR).toHaveProperty('rotate_logs')
  })

  it('produces a payload the sidecar recognizes for proxied actions (no underscore leaks)', () => {
    // Only container-level actions are proxied to the sidecar; local actions
    // (flush_cache, rotate_logs) never leave the process and keep their names.
    for (const publicName of ['restart', 'db_backup', 'db_integrity']) {
      const sidecarName = OPS_ACTION_TO_SIDECAR[publicName as keyof typeof OPS_ACTION_TO_SIDECAR]
      expect(sidecarName).not.toContain('_')
    }
  })
})
