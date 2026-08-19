/**
 * Contact Service — Typed queries for contact submissions
 *
 * Owns the shared contact queries used by the public submit route,
 * the admin contacts pages, and the admin layout unread badge.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, desc } from 'drizzle-orm'
import { getFilteredCount, getTableCount } from '$lib/server/utils/pagination'

export interface ContactSubmissionInput {
  name: string
  email: string
  message: string
  consent: boolean
  phone?: string
  subject?: string
}

/** Insert a new contact submission (public form). */
export function createSubmission(input: ContactSubmissionInput) {
  const db = useDatabase()
  const result = db
    .insert(schema.contactSubmissions)
    .values({
      name: input.name,
      email: input.email,
      message: input.message,
      consent: input.consent,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      createdAt: new Date()
    })
    .returning({ id: schema.contactSubmissions.id, createdAt: schema.contactSubmissions.createdAt })
    .get()
  return result
}

/** Admin list: paginated submissions. */
export function getSubmissions(page: number, pageSize: number, offset: number) {
  const db = useDatabase()
  const all = db
    .select()
    .from(schema.contactSubmissions)
    .orderBy(desc(schema.contactSubmissions.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all()
  const total = getTableCount(schema.contactSubmissions)
  return { items: all, total }
}

/** Unread count for the admin layout badge. */
export function getUnreadCount(): number {
  return getFilteredCount(schema.contactSubmissions, eq(schema.contactSubmissions.read, false))
}

/** Set the read state of a submission (reversible — true or false). */
export function setRead(id: number, read: boolean): boolean {
  const db = useDatabase()
  const result = db
    .update(schema.contactSubmissions)
    .set({ read })
    .where(eq(schema.contactSubmissions.id, id))
    .run()
  return result.changes > 0
}

/** Mark a submission as read. */
export function markAsRead(id: number): boolean {
  return setRead(id, true)
}

/** Delete a submission. */
export function deleteSubmission(id: number): boolean {
  const db = useDatabase()
  const result = db
    .delete(schema.contactSubmissions)
    .where(eq(schema.contactSubmissions.id, id))
    .run()
  return result.changes > 0
}
