/**
 * Legal Documents Utility
 *
 * Reads legal document content from the DB (runtime owner, admin-editable)
 * with a filesystem /legal/{locale}/{slug}.md fallback for locales or slugs
 * that have no DB row yet. Mirrors PM v2 useLegalDocuments composable.
 * Server-only: imports $lib/server/db (the DB may be uninitialized in some
 * paths, so every DB access is guarded and falls back to the filesystem).
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_LOCALE } from '$lib/config/site'
import { useDatabase, schema } from '$lib/server/db'
import { and, eq } from 'drizzle-orm'

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
 * DB-first content read: returns the row content for a slug+locale, or null
 * when the table has no row or the DB is unavailable. The filesystem remains
 * the fallback so the footer/legal page never break on an empty DB.
 */
function readDbContent(slug: string, locale: string): string | null {
  try {
    const row = useDatabase()
      .select({ content: schema.legalDocuments.content })
      .from(schema.legalDocuments)
      .where(and(eq(schema.legalDocuments.slug, slug), eq(schema.legalDocuments.locale, locale)))
      .get()
    return row?.content ?? null
  } catch {
    return null
  }
}

/**
 * DB-first slug list: slugs that have a row for the locale, or null when the
 * table has no rows for that locale at all (caller falls back to filesystem).
 */
function readDbSlugs(locale: string): string[] | null {
  try {
    const rows = useDatabase()
      .select({ slug: schema.legalDocuments.slug })
      .from(schema.legalDocuments)
      .where(eq(schema.legalDocuments.locale, locale))
      .all()
    return rows.length > 0 ? rows.map(row => row.slug) : null
  } catch {
    return null
  }
}

/**
 * List legal documents available in a given locale.
 * DB first (admin-edited rows), filesystem fallback for unseeded locales.
 */
export function listLegalDocuments(locale: string): LegalDocument[] {
  const dbSlugs = readDbSlugs(locale)
  if (dbSlugs) {
    return dbSlugs.map(slug => {
      const file = DOCUMENT_SLUGS[slug] ?? slug
      return { slug, file, locales: [locale] }
    })
  }

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
 * Read a legal document for a locale: DB row first, then the filesystem
 * corpus falling back through requested locale → DEFAULT_LOCALE → framework
 * English baseline. Returns null if unavailable in all sources.
 */
export function readLegalDocument(slug: string, locale: string): string | null {
  const fileSlug = DOCUMENT_SLUGS[slug] ?? slug
  const candidates = [...new Set([locale, DEFAULT_LOCALE, LEGAL_BASELINE_LOCALE])]

  for (const candidate of candidates) {
    const dbContent = readDbContent(slug, candidate)
    if (dbContent !== null) return dbContent
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
