/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Role hierarchy:
 * - master: Developer/agency who builds the site (full access)
 * - admin: Client who owns the site (can manage content + users except master)
 * - editor: Client's employees (can only edit content)
 */
import { type UserRole, USER_ROLES } from '../database/schema'
import { createApiError } from './api-error'

/**
 * Role hierarchy - higher index = more permissions
 * Canonical definition is in pm-core/app/types/config.ts (ROLE_LEVELS)
 * This is kept for backward compatibility with server code
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  editor: 0,
  admin: 1,
  master: 2
}

/**
 * Check if a user has at least the minimum required role
 */
export function hasRole(userRole: UserRole | undefined, minRole: UserRole): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole]
}

/**
 * Check if user is master
 */
export function isMaster(userRole: UserRole | undefined): boolean {
  return userRole === 'master'
}

/**
 * Check if user is admin or higher
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, 'admin')
}

/**
 * Check if user can manage other users
 * - Master can manage all users
 * - Admin can manage admin and editor users (not master)
 * - Editor cannot manage users
 */
export function canManageUsers(userRole: UserRole | undefined): boolean {
  return hasRole(userRole, 'admin')
}

/**
 * Check if user can manage a specific target user
 * - Master can manage anyone
 * - Admin can manage admin and editor (not master)
 * - Editor cannot manage anyone
 */
export function canManageUser(actorRole: UserRole | undefined, targetRole: UserRole): boolean {
  if (!actorRole) return false

  // Master can manage anyone
  if (actorRole === 'master') return true

  // Admin can manage admin and editor (not master)
  if (actorRole === 'admin') {
    return targetRole !== 'master'
  }

  // Editor cannot manage anyone
  return false
}

/**
 * Get roles that a user can assign to others
 * - Master can assign any role
 * - Admin can assign admin or editor (not master)
 * - Editor cannot assign roles
 */
export function getAssignableRoles(userRole: UserRole | undefined): UserRole[] {
  if (!userRole) return []

  if (userRole === 'master') {
    return [...USER_ROLES]
  }

  if (userRole === 'admin') {
    return ['admin', 'editor']
  }

  return []
}

/**
 * Require a minimum role - throws 403 if not met
 */
export function requireRole(
  userRole: UserRole | undefined,
  minRole: UserRole
): void {
  if (!hasRole(userRole, minRole)) {
    throw createApiError(403, 'auth.insufficientRole', {
      requiredRole: minRole,
      actualRole: userRole ?? null
    })
  }
}

/**
 * Require master role - throws 403 if not master
 */
export function requireMaster(userRole: UserRole | undefined): void {
  if (!isMaster(userRole)) {
    throw createApiError(403, 'auth.masterRequired', {
      requiredRole: 'master',
      actualRole: userRole ?? null
    })
  }
}

/**
 * Require admin role or higher - throws 403 if not admin+
 */
export function requireAdmin(userRole: UserRole | undefined): void {
  if (!isAdmin(userRole)) {
    throw createApiError(403, 'auth.adminRequired', {
      requiredRole: 'admin',
      actualRole: userRole ?? null
    })
  }
}

/**
 * Role display names for UI
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  master: 'Master',
  admin: 'Admin',
  editor: 'Editor'
}

/**
 * Role descriptions for UI
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  master: 'Full access - developer/agency who builds the site',
  admin: 'Site owner - can manage content and users',
  editor: 'Content editor - can only edit content'
}
