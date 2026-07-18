/**
 * Shared TypeScript Types
 *
 * Central location for all shared types.
 * Import from '~~/pm-core/app/types'.
 */

// Auth types
export { ADMIN_PAGE_IDS } from './auth'
export type { UserRole, User, LoginCredentials, AdminPageId, RolePermissions, Role } from './auth'

// UI types
export type { ToastType, Toast, ToastOptions } from './toast'
export type { ConfirmOptions, ConfirmState } from './confirm'

// Data types
export type { SiteSettings } from './settings'

// Content types
export {
  PORTFOLIO_TYPES,
  PORTFOLIO_ITEM_TYPES
} from './content'
export type {
  DateLike,
  PortfolioType,
  PortfolioItemType,
  Portfolio,
  PortfolioItem,
  PortfolioWithItems,
  ContactSubmission,
  GalleryPortfolioItem,
  CaseStudyPortfolioItem,
  DiscriminatedPortfolioItem
} from './content'

// Admin types
export type {
  Translation,
  TranslationsData,
  HealthStatus,
  CheckStatus,
  MonitoringStatus,
  HealthCheck,
  HealthData,
  MonitoringSeriesPoint,
  MonitoringMetric,
  MonitoringSummary,
  OpsActionDefinition,
  OpsActionResult,
  OpsContainerStatus,
  OpsLogResponse,
  OpsPathStatus,
  OpsSummary,
  SupportBundle,
  LogEntry,
  AuditLogEntry,
  TerminalCommandResult,
  TerminalCommandOption
} from './admin'

// Config types (modular entity architecture)
export {
  ROLE_HIERARCHY,
  ROLE_LEVELS,
  canAccess,
  hasRoleLevel,
  defaultSystemModules,
  defaultWebsiteModules,
  defaultAdminConfig,
  getAdminSections,
  filterSectionsByRole,
  defineWebsiteSections,
  getDynamicWebsiteSectionIds,
  getHomepageWebsiteSectionIds,
  getNavWebsiteSectionIds,
  getWebsiteSectionHref,
  getWebsiteSectionPath,
  isWebsiteSectionPage,
  buildWebsiteNavLinks
} from './config'
export type {
  PmMode,
  AiWorkflow,
  ProjectType,
  EntitiesConfig,
  AdminModuleConfig,
  SystemModulesConfig,
  WebsiteModulesConfig,
  AppModulesConfig,
  AdminConfig,
  AdminSection,
  WebsiteSection,
  WebsiteSectionId,
  WebsiteSectionDefinition,
  WebsiteNavLink
} from './config'

// Module types and registry
export * from './modules'
