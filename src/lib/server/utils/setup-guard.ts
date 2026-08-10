/**
 * Setup Guard (PM v2 server/utils/setup-guard.ts parity)
 *
 * Prevents access to setup endpoints when the project is already configured.
 * Setup APIs should only be accessible when PM_MODE is 'unconfigured'.
 *
 * Setup mode is entered and exited through TWO aligned sources:
 *   1. src/project/site-config.ts — PM_MODE. A fresh project ships with
 *      PM_MODE = 'unconfigured'; the operator flips it to 'build'/'develop'
 *      once the project config is finalized.
 *   2. A persistent completion marker (settings row `setup.completed`). The
 *      init wizard writes it after a successful submission, so /init stops
 *      being the active route even while PM_MODE is still 'unconfigured'.
 *
 * `isSetupRequired()` is true only while BOTH sources say "not configured":
 * the static PM_MODE and the absence of the persisted completion marker.
 *
 * Security: Fails CLOSED — denies access when config cannot be read.
 */
import { error } from '@sveltejs/kit'
import { PM_MODE, type PmMode } from '$lib/config/site'
import { getSetting, setSetting } from '$lib/server/services/settings'

/** Settings key persisted by the init wizard once setup completes. */
export const SETUP_COMPLETED_KEY = 'setup.completed'

/**
 * True when the init wizard has already run and marked the site configured.
 * Reads the persistent settings store, so the state survives restarts.
 */
export function isSetupCompleted(): boolean {
  return getSetting(SETUP_COMPLETED_KEY) === 'true'
}

/**
 * Persist the configured state. Called by the init wizard after a successful
 * submission — after this, /init redirects to the site.
 */
export function markSetupCompleted(): void {
  setSetting(SETUP_COMPLETED_KEY, 'true', 'string', 'system')
}

/**
 * Assert the site is in setup mode. Throws 403 if already configured.
 * Call at the top of setup-only endpoints.
 */
export function requireSetupMode(): PmMode {
  if (!isSetupRequired()) {
    error(403, 'Setup is not allowed: the site is already configured')
  }
  return PM_MODE
}

/**
 * True when the site is unconfigured and the setup wizard should be shown.
 */
export function isSetupRequired(): boolean {
  return PM_MODE === 'unconfigured' && !isSetupCompleted()
}
