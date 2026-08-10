/**
 * Team Service — Typed queries for team members + translations
 *
 * Owns the shared team queries used by the homepage section,
 * the public API, and admin CRUD routes.
 *
 * Every translation join is filtered by locale (AGENTS.md E.4) so member
 * positions/bios match the active language.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, and, asc } from 'drizzle-orm'
import type { TeamMemberCard } from '$lib/components/sections/types'

/**
 * Homepage section: published team members with current-locale translation.
 * Position falls back to the base row when the locale has no translation.
 */
export function getHomepageTeam(locale: string): TeamMemberCard[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.teamMembers.id,
    slug: schema.teamMembers.slug,
    name: schema.teamMembers.name,
    basePosition: schema.teamMembers.position,
    photoUrl: schema.teamMembers.photoUrl,
    position: schema.teamMemberTranslations.position,
    bio: schema.teamMemberTranslations.bio
  })
    .from(schema.teamMembers)
    .leftJoin(schema.teamMemberTranslations, and(
      eq(schema.teamMemberTranslations.memberId, schema.teamMembers.id),
      eq(schema.teamMemberTranslations.locale, locale)
    ))
    .where(eq(schema.teamMembers.published, true))
    .orderBy(asc(schema.teamMembers.order))
    .all()

  return rows.map(r => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    position: r.position ?? r.basePosition,
    bio: r.bio ?? undefined,
    photoUrl: r.photoUrl
  }))
}

/** Admin list: all team members with their translations grouped by locale. */
export function getAdminTeamMembers() {
  const db = useDatabase()
  const members = db.select().from(schema.teamMembers).orderBy(asc(schema.teamMembers.order)).all()
  const translations = db.select().from(schema.teamMemberTranslations).all()
  const byMember = new Map<number, typeof translations>()
  for (const t of translations) {
    const list = byMember.get(t.memberId) ?? []
    list.push(t)
    byMember.set(t.memberId, list)
  }
  return members.map(m => {
    const perLocale: Record<string, { position: string | null; bio: string | null }> = {}
    for (const t of byMember.get(m.id) ?? []) {
      perLocale[t.locale] = { position: t.position ?? null, bio: t.bio ?? null }
    }
    let socialLinks: Record<string, string> | null = null
    if (m.socialLinks) {
      try {
        socialLinks = JSON.parse(m.socialLinks) as Record<string, string>
      } catch {
        socialLinks = null
      }
    }
    return { ...m, socialLinks, translations: perLocale }
  })
}
