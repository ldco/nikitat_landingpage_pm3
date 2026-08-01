import type { RequestEvent } from '@sveltejs/kit'
import { useDatabase, schema } from '$lib/server/db'

export function load(_event: RequestEvent) {
  const db = useDatabase()

  const userCount = db.select({ count: schema.users.id }).from(schema.users).all().length
  const portfolioCount = db.select({ count: schema.portfolios.id }).from(schema.portfolios).all().length
  const blogCount = db.select({ count: schema.blogPosts.id }).from(schema.blogPosts).all().length
  const contactCount = db.select({ count: schema.contactSubmissions.id }).from(schema.contactSubmissions).all().length

  return {
    stats: {
      users: userCount,
      portfolios: portfolioCount,
      blogPosts: blogCount,
      contacts: contactCount
    }
  }
}
