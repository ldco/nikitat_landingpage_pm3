/**
 * Setup Guard (PM v2 server/utils/setup-guard.ts parity)
 *
 * Prevents access to setup endpoints when the project is already configured.
 * Setup APIs should only be accessible when PM_MODE is 'unconfigured'.
 *
 * Security: Fails CLOSED — denies access when config cannot be read.
 */
import { error } from '@sveltejs/kit'
import { PM_MODE, type PmMode } from '$lib/config/site'

/**
 * Assert the site is in setup mode. Throws 403 if already configured.
 * Call at the top of setup-only endpoints.
 */
export function requireSetupMode(): PmMode {
  if (PM_MODE !== 'unconfigured') {
    error(403, 'Setup is not allowed: the site is already configured')
  }
  return PM_MODE
}

/**
 * True when the site is unconfigured and the setup wizard should be shown.
 */
export function isSetupRequired(): boolean {
  return PM_MODE === 'unconfigured'
}
