/**
 * Pagination Helpers — one shared implementation for admin list pages and
 * API list handlers so page size defaults, offset math and total pages can
 * never drift between surfaces.
 */
import { count } from 'drizzle-orm'
import type { AnySQLiteTable } from 'drizzle-orm/sqlite-core'
import type { SQL } from 'drizzle-orm'
import { useDatabase } from '$lib/server/db'

export interface PaginationParams {
  page: number
  pageSize: number
  offset: number
}

export function getPaginationParams(url: URL, defaultPageSize = 10): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || String(defaultPageSize), 10) || defaultPageSize))
  const offset = (page - 1) * pageSize
  return { page, pageSize, offset }
}

export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize)
}

export function buildPagination(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: calculateTotalPages(total, pageSize) }
}

/**
 * Row count via SQL `count()` — never loads rows into JS to count them.
 * `where` is optional for filtered counts (published-only lists, etc.).
 */
export function getFilteredCount<TTable extends AnySQLiteTable>(
  table: TTable,
  where?: SQL
): number {
  const query = useDatabase().select({ value: count() }).from(table)
  if (where) query.where(where)
  return query.get()?.value ?? 0
}

/** Unfiltered row count for a table. */
export function getTableCount(table: AnySQLiteTable): number {
  return getFilteredCount(table)
}
