/**
 * Service Layer — Typed DB access for routes
 *
 * Routes import services, NOT Drizzle directly. Each service module owns
 * the queries for one entity, so the same query is never duplicated across
 * page loads, API routes, and admin CRUD.
 *
 * To add a new entity:
 *   1. Create services/<entity>.ts following the pattern in services/blog.ts
 *   2. Export it from this index
 *   3. Routes call the service functions
 *
 * The admin CRUD routes may still use Drizzle for single-row inserts/updates
 * that are unique to one route; shared queries (lists, public reads) live here.
 */
export * from './blog'
export * from './faq'
export * from './features'
export * from './pricing'
export * from './portfolio'
export * from './contact'
export * from './settings'
export * from './translations'
export * from './users'
