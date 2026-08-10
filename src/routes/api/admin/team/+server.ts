import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getAdminTeamMembers } from '$lib/server/services/team'

export const _teamTranslationsSchema = z.record(
  z.string(),
  z.object({
    position: z.string().max(100).optional(),
    bio: z.string().max(2000).optional()
  })
).optional()

export const _createTeamMemberSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  photoUrl: z.string().max(500).nullish(),
  hoverPhotoUrl: z.string().max(500).nullish(),
  email: z.string().email().max(255).nullish(),
  phone: z.string().max(30).nullish(),
  department: z.string().max(50).nullish(),
  socialLinks: z.record(z.string(), z.string()).nullish(),
  order: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
  translations: _teamTranslationsSchema
})

export function GET(event: RequestEvent) {
  requireAdminPage(event, 'team')
  return json(jsonSuccess(getAdminTeamMembers()))
}

export async function POST(event: RequestEvent) {
  requireAdminPage(event, 'team')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = _createTeamMemberSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  const { translations, socialLinks, ...data } = parsed.data
  const db = useDatabase()

  const existing = db.select({ id: schema.teamMembers.id }).from(schema.teamMembers).where(eq(schema.teamMembers.slug, data.slug)).get()
  if (existing) throw error(409, 'Slug already exists')

  const member = db.insert(schema.teamMembers).values({
    ...data,
    socialLinks: socialLinks ? JSON.stringify(socialLinks) : null
  }).returning().get()

  if (translations) {
    const values: Array<{ memberId: number; locale: string; position: string | null; bio: string | null }> = []
    for (const [locale, t] of Object.entries(translations)) {
      values.push({
        memberId: member.id,
        locale,
        position: t.position ?? null,
        bio: t.bio ?? null
      })
    }
    if (values.length > 0) {
      db.insert(schema.teamMemberTranslations).values(values).run()
    }
  }

  return json(jsonSuccess({ id: member.id }))
}
