/**
 * Audit Logging
 *
 * Logs security-relevant events to the audit_logs table.
 * Authentication, user management, role changes, 2FA, etc.
 */
import { useDatabase, schema } from '$lib/server/db'
import type { AuditAction } from '$lib/server/db/schema'
import { logger } from '$lib/server/utils/logger'

interface AuditParams {
  action: AuditAction
  userId?: number | null
  targetUserId?: number | null
  ipAddress?: string | null
  userAgent?: string | null
  details?: Record<string, unknown>
  success?: boolean
}

function logAudit(params: AuditParams): void {
  const db = useDatabase()
  try {
    db.insert(schema.auditLogs).values({
      action: params.action,
      userId: params.userId ?? null,
      targetUserId: params.targetUserId ?? null,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      details: params.details ? JSON.stringify(params.details) : null,
      success: params.success ?? true
    }).run()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error({ action: params.action, error: message }, 'Failed to log audit event')
  }
}

export const audit = {
  login(ip: string, ua: string | null, userId: number) {
    logAudit({ action: 'login', userId, targetUserId: userId, ipAddress: ip, userAgent: ua })
  },

  loginFailed(ip: string, ua: string | null, email: string, reason: string, userId?: number) {
    logAudit({ action: 'login_failed', targetUserId: userId, ipAddress: ip, userAgent: ua, details: { email, reason }, success: false })
  },

  logout(ip: string, ua: string | null, userId: number) {
    logAudit({ action: 'logout', userId, targetUserId: userId, ipAddress: ip, userAgent: ua })
  },

  passwordChange(ip: string, ua: string | null, actorId: number, targetUserId: number) {
    logAudit({ action: 'password_change', userId: actorId, targetUserId: targetUserId, ipAddress: ip, userAgent: ua, details: { selfChange: actorId === targetUserId } })
  },

  roleChange(ip: string, ua: string | null, actorId: number, targetUserId: number, oldRole: string, newRole: string) {
    logAudit({ action: 'role_change', userId: actorId, targetUserId: targetUserId, ipAddress: ip, userAgent: ua, details: { oldRole, newRole } })
  },

  userCreate(ip: string, ua: string | null, actorId: number, newUserId: number, email: string, role: string) {
    logAudit({ action: 'user_create', userId: actorId, targetUserId: newUserId, ipAddress: ip, userAgent: ua, details: { email, role } })
  },

  userUpdate(ip: string, ua: string | null, actorId: number, targetUserId: number, changes: Record<string, unknown>) {
    logAudit({ action: 'user_update', userId: actorId, targetUserId: targetUserId, ipAddress: ip, userAgent: ua, details: { changes } })
  },

  userDelete(ip: string, ua: string | null, actorId: number, targetUserId: number, email: string) {
    logAudit({ action: 'user_delete', userId: actorId, targetUserId: targetUserId, ipAddress: ip, userAgent: ua, details: { email } })
  },

  accountLocked(ip: string, ua: string | null, userId: number, reason: string) {
    logAudit({ action: 'account_locked', targetUserId: userId, ipAddress: ip, userAgent: ua, details: { reason } })
  },

  twoFactorEnabled(ip: string, ua: string | null, userId: number) {
    logAudit({ action: '2fa_enabled', userId, targetUserId: userId, ipAddress: ip, userAgent: ua })
  },

  twoFactorDisabled(ip: string, ua: string | null, actorId: number, targetUserId: number, reason?: string) {
    logAudit({ action: '2fa_disabled', userId: actorId, targetUserId: targetUserId, ipAddress: ip, userAgent: ua, details: { reason: reason || 'User disabled 2FA', selfAction: actorId === targetUserId } })
  },

  twoFactorVerified(ip: string, ua: string | null, userId: number, method: string) {
    logAudit({ action: '2fa_verified', userId, targetUserId: userId, ipAddress: ip, userAgent: ua, details: { method } })
  },

  twoFactorFailed(ip: string, ua: string | null, userId: number, reason: string) {
    logAudit({ action: '2fa_failed', userId, targetUserId: userId, ipAddress: ip, userAgent: ua, details: { reason }, success: false })
  },

  settingsUpdate(ip: string, ua: string | null, actorId: number, details: Record<string, unknown>) {
    logAudit({ action: 'settings_update', userId: actorId, ipAddress: ip, userAgent: ua, details })
  },

  roleCreate(ip: string, ua: string | null, actorId: number, roleId: number, roleName: string, roleSlug: string) {
    logAudit({ action: 'role_create', userId: actorId, ipAddress: ip, userAgent: ua, details: { roleId, roleName, roleSlug } })
  },

  roleUpdate(ip: string, ua: string | null, actorId: number, roleId: number, roleName: string, changes: Record<string, unknown>) {
    logAudit({ action: 'role_update', userId: actorId, ipAddress: ip, userAgent: ua, details: { roleId, roleName, changes } })
  },

  roleDelete(ip: string, ua: string | null, actorId: number, roleId: number, roleName: string) {
    logAudit({ action: 'role_delete', userId: actorId, ipAddress: ip, userAgent: ua, details: { roleId, roleName } })
  },


  terminalCommand(ip: string, ua: string | null, actorId: number, command: string, success: boolean) {
    logAudit({ action: 'terminal_command', userId: actorId, ipAddress: ip, userAgent: ua, details: { command }, success })
  },

  opsAction(ip: string, ua: string | null, actorId: number, action: string, success: boolean) {
    logAudit({ action: 'ops_action', userId: actorId, ipAddress: ip, userAgent: ua, details: { opsAction: action }, success })
  },

  supportBundleExport(ip: string, ua: string | null, actorId: number, success: boolean) {
    logAudit({ action: 'support_bundle_export', userId: actorId, ipAddress: ip, userAgent: ua, success })
  }
}
