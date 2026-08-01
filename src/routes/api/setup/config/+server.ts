/**
 * GET /api/setup/config
 *
 * Returns current setup state: whether the site is configured
 * (PM_MODE !== 'unconfigured') and basic config summary.
 */
import { json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { PM_MODE } from '$lib/config/site'

export function GET(_event: RequestEvent) {
  return json({
    success: true,
    data: {
      configured: PM_MODE !== 'unconfigured',
      mode: PM_MODE,
      locales: ['ru', 'en', 'fr', 'he'],
      defaultLocale: 'ru'
    }
  })
}
