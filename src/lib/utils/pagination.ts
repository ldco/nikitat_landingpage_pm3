/**
 * Pagination helpers (client-side)
 *
 * PM v2 parity: app-nuxt/app/composables/usePagination.ts (pageNumbers logic).
 * The framework also has server-side helpers in $lib/server/utils/pagination.ts;
 * this module provides the client-side page-window computation for the
 * <Pagination /> component.
 */

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize)
}

export function buildMeta(total: number, page: number, pageSize: number): PaginationMeta {
  const totalPages = calculateTotalPages(total, pageSize)
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  }
}

/**
 * Page numbers for the pagination bar (with '...' gaps).
 * Mirrors v2 usePagination's pageNumbers logic.
 */
export function pageNumbers(currentPage: number, totalPages: number): Array<number | '...'> {
  const pages: Array<number | '...'> = []
  const total = totalPages

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
    return pages
  }

  pages.push(1)

  if (currentPage > 3) pages.push('...')

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(total - 1, currentPage + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (currentPage < total - 2) pages.push('...')

  pages.push(total)
  return pages
}
