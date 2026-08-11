/**
 * Legal Documents Service — typed queries for the legal_documents table.
 *
 * The DB is the runtime owner of legal document content (ADR-003): the admin
 * editor writes here and the public legal page reads here first, falling back
 * to the filesystem corpus when a row is missing. The filesystem /legal/
 * directory remains the seed source and the offline fallback.
 */
import { useDatabase, schema } from '$lib/server/db'
import { and, eq } from 'drizzle-orm'
import { LEGAL_DOCUMENT_SLUGS } from '$lib/server/db/seed-data/legal'

export interface LegalDocumentRow {
  slug: string
  locale: string
  content: string
}

/** Every legal document for one locale (including missing rows as empty). */
export function getLegalDocumentsForLocale(locale: string): LegalDocumentRow[] {
  const db = useDatabase()
  const rows = db.select({
    slug: schema.legalDocuments.slug,
    locale: schema.legalDocuments.locale,
    content: schema.legalDocuments.content
  })
    .from(schema.legalDocuments)
    .where(eq(schema.legalDocuments.locale, locale))
    .all()

  const bySlug = new Map(rows.map(row => [row.slug, row]))
  // Always return the full known set so the editor shows every document even
  // before any row exists (empty content → "missing" state in the UI).
  return LEGAL_DOCUMENT_SLUGS.map(slug => bySlug.get(slug) ?? { slug, locale, content: '' })
}

/** Locales that have at least one legal document row. */
export function getLegalDocumentLocales(): string[] {
  const db = useDatabase()
  const rows = db.select({ locale: schema.legalDocuments.locale })
    .from(schema.legalDocuments)
    .all()
  return [...new Set(rows.map(row => row.locale))]
}

/** Upsert a legal document row for a slug+locale. */
export function upsertLegalDocument(slug: string, locale: string, content: string) {
  const db = useDatabase()
  const existing = db.select({ id: schema.legalDocuments.id })
    .from(schema.legalDocuments)
    .where(and(
      eq(schema.legalDocuments.slug, slug),
      eq(schema.legalDocuments.locale, locale)
    ))
    .get()
  if (existing) {
    db.update(schema.legalDocuments)
      .set({ content, updatedAt: new Date() })
      .where(eq(schema.legalDocuments.id, existing.id))
      .run()
  } else {
    db.insert(schema.legalDocuments).values({ slug, locale, content }).run()
  }
}

/** Delete a legal document row (falls back to filesystem on read). */
export function deleteLegalDocument(slug: string, locale: string) {
  const db = useDatabase()
  db.delete(schema.legalDocuments)
    .where(and(
      eq(schema.legalDocuments.slug, slug),
      eq(schema.legalDocuments.locale, locale)
    ))
    .run()
}
