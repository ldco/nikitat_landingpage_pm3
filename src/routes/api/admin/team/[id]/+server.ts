import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { eq, and, ne } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { _createTeamMemberSchema } from '../+server'

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'team')
  const db = useDatabase()
  const id = z.coerce.number().int().positive().parse(event.params.id)
  const member = db.select().from(schema.teamMembers).where(eq(schema.teamMembers.id, id)).get()
  if (!member) throw error(404)
  const translations = db.select().from(schema.teamMemberTranslations).where(eq(schema.teamMemberTranslations.memberId, id)).all()
  const perLocale: Record<string, { position: string | null; bio: string | null }> = {}
  for (const t of translations) {
    perLocale[t.locale] = { position: t.position ?? null, bio: t.bio ?? null }
  }
  let socialLinks: Record<string, string> | null = null
  if (member.socialLinks) {
    try {
      socialLinks = JSON.parse(member.socialLinks) as Record<string, string>
    } catch {
      socialLinks = null
    }
  }
  return json(jsonSuccess({ ...member, socialLinks, translations: perLocale }))
}

export async function PUT(event: RequestEvent) {
  requireAdminPage(event, 'team')
  const id = z.coerce.number().int().positive().parse(event.params.id)
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)

  const updateSchema = _createTeamMemberSchema.partial()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const { translations, socialLinks, ...data } = parsed.data
  const db = useDatabase()

  const existing = db.select().from(schema.teamMembers).where(eq(schema.teamMembers.id, id)).get()
  if (!existing) throw error(404)

  if (data.slug && data.slug !== existing.slug) {
    const slugExists = db.select({ id: schema.teamMembers.id }).from(schema.teamMembers)
      .where(and(eq(schema.teamMembers.slug, data.slug), ne(schema.teamMembers.id, id))).get()
    if (slugExists) throw error(409, 'Slug already exists')
  }

  const updateValues: Record<string, unknown> = {}
  for (const key of ['slug', 'name', 'photoUrl', 'hoverPhotoUrl', 'email', 'phone', 'department', 'order', 'published'] as const) {
    if (data[key] !== undefined) updateValues[key] = data[key]
  }
  if (socialLinks !== undefined) updateValues.socialLinks = socialLinks ? JSON.stringify(socialLinks) : null

  if (Object.keys(updateValues).length > 0) {
    db.update(schema.teamMembers).set(updateValues).where(eq(schema.teamMembers.id, id)).run()
  }

  if (translations) {
    for (const [locale, t] of Object.entries(translations)) {
      const row = db.select({ id: schema.teamMemberTranslations.id }).from(schema.teamMemberTranslations)
        .where(and(
          eq(schema.teamMemberTranslations.memberId, id),
          eq(schema.teamMemberTranslations.locale, locale)
        )).get()
      // Only touch fields explicitly provided — a partial update must not
      // wipe the sibling field (matches the testimonials PUT behavior).
      const values: { position?: string | null; bio?: string | null } = {}
      if (t.position !== undefined) values.position = t.position
      if (t.bio !== undefined) values.bio = t.bio
      if (row && Object.keys(values).length > 0) {
        db.update(schema.teamMemberTranslations).set(values).where(eq(schema.teamMemberTranslations.id, row.id)).run()
      } else if (!row && (t.position !== undefined || t.bio !== undefined)) {
        db.insert(schema.teamMemberTranslations).values({ memberId: id, locale, ...values }).run()
      }
    }
  }

  return json(jsonSuccess({ id }))
}

export async function DELETE(event: RequestEvent) {
  requireAdminPage(event, 'team')
  const id = z.coerce.number().int().positive().parse(event.params.id)
  const db = useDatabase()
  const existing = db.select({ id: schema.teamMembers.id }).from(schema.teamMembers).where(eq(schema.teamMembers.id, id)).get()
  if (!existing) throw error(404)
  db.delete(schema.teamMemberTranslations).where(eq(schema.teamMemberTranslations.memberId, id)).run()
  db.delete(schema.teamMembers).where(eq(schema.teamMembers.id, id)).run()
  return json(jsonSuccess({ deleted: true }))
}
