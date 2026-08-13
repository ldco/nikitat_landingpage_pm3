/**
 * Legal Editor helpers — docs-form hydration for the admin legal page.
 *
 * `hydrateDocsForm()` is the pure core of the legal page's synchronous init:
 * it builds the per-slug/per-locale content map from the server-provided
 * `byLocale` set so EVERY locale is hydrated during the first pass. A missing
 * row (no DB entry yet) hydrates to an empty string — the editor's "missing"
 * state — while every locale that HAS a row keeps its real content, so a tab
 * switch never blanks out an existing document.
 */

export interface LegalEditorRow {
  slug: string
  content: string
}

/** The legal documents managed by the admin legal editor (shared with the page save loop). */
export const LEGAL_DOC_SLUGS = ['privacy-policy', 'personal-data-policy', 'terms-of-service'] as const

export function hydrateDocsForm(
  byLocale: Record<string, LegalEditorRow[]>,
  locales: readonly string[],
  slugs: readonly string[]
): Record<string, Record<string, string>> {
  const form: Record<string, Record<string, string>> = {}
  for (const slug of slugs) {
    form[slug] = {}
    for (const locale of locales) {
      const row = (byLocale[locale] ?? []).find(r => r.slug === slug)
      form[slug][locale] = row?.content ?? ''
    }
  }
  return form
}
