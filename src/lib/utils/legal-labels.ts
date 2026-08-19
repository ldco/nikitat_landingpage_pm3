/**
 * Legal Document Labels — client-safe constants shared by the footer, the
 * legal page and the server-side legal service.
 *
 * Kept separate from $lib/utils/legal-documents.ts (which imports the
 * server-only DB client) so client components can resolve legal-document
 * slugs/labels without pulling server modules into the bundle.
 */

/** Canonical slug list — single source for route guards and known-doc checks. */
export const LEGAL_DOCUMENT_SLUGS = ['privacy-policy', 'personal-data-policy', 'terms-of-service']

/**
 * Dotted i18n label key for a legal document — the single shared slug→label
 * mapping used by the footer links, the legal page <title> and the admin
 * legal editor (so labels can never drift between surfaces).
 */
export function legalDocumentLabelKey(slug: string): string {
  if (slug === 'privacy-policy') return 'footer.privacy'
  if (slug === 'personal-data-policy') return 'footer.personalData'
  return 'footer.terms'
}
