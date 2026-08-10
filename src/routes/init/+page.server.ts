import type { PageServerLoad, Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { isSetupRequired, markSetupCompleted } from '$lib/server/utils/setup-guard'
import { setSetting } from '$lib/server/services/settings'
import { CSRF_COOKIE_NAME } from '$lib/server/security/csrf'
import { LOCALES } from '$lib/config/site'

const initSchema = z.object({
  contactEmail: z.string().email(),
  defaultLocale: z.enum(LOCALES as [string, ...string[]])
})

export const load: PageServerLoad = (event) => {
  // audit I-18: the wizard only runs before the project is configured.
  // When configured, redirect to the site.
  if (!isSetupRequired()) {
    redirect(303, '/')
  }
  return {
    locales: LOCALES,
    configured: false,
    // The CSRF hook sets the double-submit cookie on this request, so the
    // token is rendered into the form server-side — the wizard's form
    // submission carries a valid `_csrf` without relying on client JS.
    csrfToken: event.cookies.get(CSRF_COOKIE_NAME) ?? ''
  }
}

export const actions: Actions = {
  default: async (event) => {
    if (!isSetupRequired()) {
      redirect(303, '/')
    }

    const form = event.locals.csrfForm ?? await event.request.formData()
    const parsed = initSchema.safeParse({
      contactEmail: form.get('contactEmail'),
      defaultLocale: form.get('defaultLocale')
    })

    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    // Persist the initial contact settings via the standard settings service.
    setSetting('contact.email', parsed.data.contactEmail, 'string', 'contact')
    setSetting('i18n.defaultLocale', parsed.data.defaultLocale, 'string', 'i18n')

    // Persist the configured state so /init is no longer the active route
    // (setup-guard's isSetupRequired() reads this marker), then leave the
    // wizard — the operator finishes the config in src/project/site-config.ts.
    markSetupCompleted()
    redirect(303, '/')
  }
}
