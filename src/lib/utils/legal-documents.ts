/**
 * Legal Documents Utility
 *
 * Reads legal document markdown files from /legal/{locale}/{slug}.md
 * and returns metadata for footer navigation and document pages.
 * Mirrors PM v2 useLegalDocuments composable.
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const LEGAL_DIR = 'legal'

export interface LegalDocument {
  slug: string
  /** File name without extension (also the translation fallback key) */
  file: string
  /** Available locales that have this document */
  locales: string[]
}

/** All known legal document slugs from the /legal directory (en baseline). */
const DOCUMENT_SLUGS: Record<string, string> = {
  'privacy-policy': 'privacy-policy',
  'personal-data-policy': 'personal-data-policy',
  'terms-of-service': 'terms-of-service'
}

/**
 * List legal documents available in a given locale.
 * Returns slugs that have a markdown file in /legal/{locale}/.
 */
export function listLegalDocuments(locale: string): LegalDocument[] {
  const localeDir = join(process.cwd(), LEGAL_DIR, locale)
  if (!existsSync(localeDir)) return []

  const files = readdirSync(localeDir).filter(f => f.endsWith('.md'))
  return files.map(file => {
    const fileSlug = file.replace(/\.md$/, '')
    const slug = Object.entries(DOCUMENT_SLUGS).find(([_, v]) => v === fileSlug)?.[0] ?? fileSlug
    return { slug, file: fileSlug, locales: [locale] }
  })
}

/**
 * Get all legal documents with their available locales (union across locales).
 * Used by footer to render legal links that exist for the current locale.
 */
export function getLegalDocuments(locale: string): Array<{ slug: string; file: string }> {
  const list = listLegalDocuments(locale)
  return list.map(({ slug, file }) => ({ slug, file }))
}

/**
 * Read a legal document markdown for a locale, falling back to English.
 * Returns null if unavailable in both.
 */
export function readLegalDocument(slug: string, locale: string): string | null {
  const fileSlug = DOCUMENT_SLUGS[slug] ?? slug
  const primary = join(process.cwd(), LEGAL_DIR, locale, `${fileSlug}.md`)
  if (existsSync(primary)) {
    return readFileSync(primary, 'utf-8')
  }
  const fallback = join(process.cwd(), LEGAL_DIR, 'en', `${fileSlug}.md`)
  if (existsSync(fallback)) {
    return readFileSync(fallback, 'utf-8')
  }
  return null
}

/** Resolve the Paraglide message key for a legal document title. */
export function legalDocumentTitleKey(file: string): string {
  const map: Record<string, string> = {
    'privacy-policy': 'legal.privacyPolicy',
    'personal-data-policy': 'legal.personalDataPolicy',
    'terms-of-service': 'legal.termsOfService'
  }
  return map[file] ?? 'legal.termsOfService'
}
