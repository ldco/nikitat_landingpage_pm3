import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { readLegalDocument } from '$lib/utils/legal-documents'
import { activeLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = ({ params, locals }) => {
  const locale = activeLocale(locals.paraglide?.lang)
  const slug = params.slug ?? ''

  const knownSlugs = ['privacy-policy', 'personal-data-policy', 'terms-of-service']
  if (!knownSlugs.includes(slug)) error(404)

  // DB-first (admin-edited content) with filesystem fallback through the
  // locale → DEFAULT_LOCALE → framework-en baseline chain.
  const markdown = readLegalDocument(slug, locale)
  if (markdown === null) error(404)
  return { markdown, slug }
}
