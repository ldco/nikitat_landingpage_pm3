import type { PageServerLoad } from './$types'
import { error } from '@sveltejs/kit'
import { readLegalDocument, LEGAL_DOCUMENT_SLUGS } from '$lib/utils/legal-documents'
import { activeLocale } from '$lib/server/utils/locales'

export const load: PageServerLoad = ({ params, locals }) => {
  const locale = activeLocale(locals.paraglide?.lang)
  const slug = params.slug ?? ''

  // Same canonical slug list that drives the footer links (legal-documents.ts)
  // — a document added there is automatically routable here.
  if (!LEGAL_DOCUMENT_SLUGS.includes(slug)) error(404)

  // DB-first (admin-edited content) with filesystem fallback through the
  // locale → DEFAULT_LOCALE → framework-en baseline chain.
  const markdown = readLegalDocument(slug, locale)
  if (markdown === null) error(404)
  return { markdown, slug }
}
