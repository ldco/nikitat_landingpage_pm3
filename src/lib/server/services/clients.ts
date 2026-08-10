/**
 * Clients Service — Typed queries for client logos
 *
 * Owns the shared client queries used by the homepage section,
 * the public API, and admin CRUD routes.
 *
 * Clients carry no per-locale translations — name/logo/website are locale-free
 * brand data, so the homepage query needs no locale join.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq, asc } from 'drizzle-orm'
import type { ClientCard } from '$lib/components/sections/types'

/** Homepage section: published clients ordered by display order. */
export function getHomepageClients(): ClientCard[] {
  const db = useDatabase()
  const rows = db.select({
    id: schema.clients.id,
    name: schema.clients.name,
    logoUrl: schema.clients.logoUrl,
    websiteUrl: schema.clients.websiteUrl,
    category: schema.clients.category
  })
    .from(schema.clients)
    .where(eq(schema.clients.published, true))
    .orderBy(asc(schema.clients.order))
    .all()

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    logoUrl: r.logoUrl ?? undefined,
    websiteUrl: r.websiteUrl ?? undefined,
    category: r.category ?? undefined
  }))
}

/** Admin list: all clients (published + draft) ordered by display order. */
export function getAdminClients() {
  const db = useDatabase()
  return db.select().from(schema.clients).orderBy(asc(schema.clients.order)).all()
}
