/**
 * Legal Documents Utility
 *
 * Reads legal document markdown files from /legal/{locale}/{slug}.md
 * and returns metadata for footer navigation and document pages.
 * Mirrors PM v2 useLegalDocuments composable.
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_LOCALE } from '$lib/config/site'

const LEGAL_DIR = 'legal'

/**
 * Framework baseline locale for legal documents: the /legal directory ships
 * with an English corpus (legal/en/), so 'en' is the final fallback for any
 * project. It is a FRAMEWORK constant (the shipped baseline corpus), not a
 * project-locale assumption — the active locale and the project DEFAULT_LOCALE
 * are tried first.
 */
const LEGAL_BASELINE_LOCALE = 'en'

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
 * Read a legal document markdown for a locale, falling back to the project
 * DEFAULT_LOCALE, then to the framework's English baseline corpus.
 * Returns null if unavailable in all three.
 */
export function readLegalDocument(slug: string, locale: string): string | null {
  const fileSlug = DOCUMENT_SLUGS[slug] ?? slug
  const candidates = [...new Set([locale, DEFAULT_LOCALE, LEGAL_BASELINE_LOCALE])]
  for (const candidate of candidates) {
    const file = join(process.cwd(), LEGAL_DIR, candidate, `${fileSlug}.md`)
    if (existsSync(file)) {
      return readFileSync(file, 'utf-8')
    }
  }
  return null
}

/** Resolve the Paraglide message function name for a legal document title. */
export function legalDocumentTitleKey(file: string): 'footer_privacy' | 'footer_personalData' | 'footer_terms' {
  const map: Record<string, 'footer_privacy' | 'footer_personalData' | 'footer_terms'> = {
    'privacy-policy': 'footer_privacy',
    'personal-data-policy': 'footer_personalData',
    'terms-of-service': 'footer_terms'
  }
  return map[file] ?? 'footer_terms'
}
