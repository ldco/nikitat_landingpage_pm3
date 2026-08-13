/**
 * Admin Users types — shared between the users route page and the
 * `UserFormModal` component.
 */

export interface AdminUser {
  id: number
  email: string
  name?: string | null
  role: string
  lockedUntil?: string | Date | null
  createdAt?: string | Date | null
}
