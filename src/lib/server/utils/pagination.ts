/**
 * Pagination Helpers
 */
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
