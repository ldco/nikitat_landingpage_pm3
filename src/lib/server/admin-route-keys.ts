/**
 * Admin route → admin.* i18n key registry.
 *
 * The admin layout load ships the merged admin translation map
 * (getAdminTranslations) to every page via data.t. Shipping the FULL map
 * (~440 keys/locale) to every route bloats every admin navigation payload;
 * this registry scopes the map to the keys the current route actually uses
 * (shell keys + page keys), while keeping the per-key default-locale merge
 * from getAdminTranslations intact — a page never renders raw keys or a
 * different language mix.
 *
 * Dynamic keys that are not literal in the markup (option lists, health-check
 * ids) are listed explicitly per route alongside the literal ones.
 *
 * Drift guard: tests/server/admin-route-keys.test.ts extracts every admin.*
 * key literal from the admin pages and fails when a page uses a key that is
 * not registered for its route — add new keys to the matching route entry when
 * that test fails.
 */
import { ADMIN_PAGE_LABEL_KEYS } from '$lib/admin-page-labels'

// Shell keys = the admin.* label keys of every page in the shell nav + mobile
// header. Derived from the single ADMIN_PAGE_LABEL_KEYS map so a page added to
// the nav can never silently drop out of the layout payload.
export const ADMIN_SHELL_KEYS: readonly string[] = Object.values(ADMIN_PAGE_LABEL_KEYS)

// Dynamic admin.* keys referenced via variable key lookups (option lists,
// health-check ids) — NOT statically extractable from the markup.
const COLOR_OPTION_KEYS = [
  'admin.colorPrimary',
  'admin.colorSecondary',
  'admin.colorSuccess',
  'admin.colorWarning',
  'admin.colorDanger'
] as const

const PORTFOLIO_TYPE_KEYS = [
  'admin.portfolioTypeBranding',
  'admin.portfolioTypeGallery',
  'admin.portfolioTypeCaseStudy',
  'admin.portfolioTypeWebsite',
  'admin.portfolioTypeBrandbook'
] as const

const ITEM_TYPE_KEYS = ['admin.image', 'admin.video', 'admin.caseStudy'] as const

const HEALTH_CHECK_KEYS = [
  'admin.healthPage.check.cpu',
  'admin.healthPage.check.database',
  'admin.healthPage.check.disk',
  'admin.healthPage.check.diskApp',
  'admin.healthPage.check.diskData',
  'admin.healthPage.check.diskDatabase',
  'admin.healthPage.check.diskUploads',
  'admin.healthPage.check.logBuffer',
  'admin.healthPage.check.nodeHeap',
  'admin.healthPage.check.ram'
] as const

const ROUTE_ADMIN_KEYS: Record<string, readonly string[]> = {
  '/admin': [
    'admin.blog',
    'admin.contacts',
    'admin.dashboard',
    'admin.portfolios',
    'admin.users'
  ],
  // Auth routes: the layout returns early and never ships the admin map; they
  // render auth.*/common.* labels via the unified t() helper. Registered with
  // no admin keys so the drift guard covers them (any future admin.* key must
  // be listed here).
  '/admin/change-password': [],
  '/admin/login': [],
  '/admin/audit': ['admin.action', 'admin.auditLog', 'admin.date', 'admin.noItems', 'admin.user'],
  '/admin/blog': ['admin.blog', 'admin.confirmDelete', 'admin.draft', 'admin.published'],
  '/admin/blog/[id]/edit': [
    'admin.basicInfo',
    'admin.category',
    'admin.content',
    'admin.coverImageAlt',
    'admin.coverImageUrl',
    'admin.dropzoneLabel',
    'admin.excerpt',
    'admin.fileTooLarge',
    'admin.published',
    'admin.readTime',
    'admin.removeTranslation',
    'admin.slug',
    'admin.title',
    'admin.uploadFailed'
  ],
  '/admin/blog/create': [
    'admin.basicInfo',
    'admin.category',
    'admin.content',
    'admin.coverImageAlt',
    'admin.coverImageUrl',
    'admin.dropzoneLabel',
    'admin.excerpt',
    'admin.fileTooLarge',
    'admin.published',
    'admin.readTime',
    'admin.slug',
    'admin.title',
    'admin.uploadFailed'
  ],
  '/admin/clients': ['admin.clients', 'admin.noItems'],
  '/admin/contacts': [
    'admin.confirmDelete',
    'admin.contacts',
    'admin.date',
    'admin.email',
    'admin.markRead',
    'admin.markUnread',
    'admin.name',
    'admin.noItems'
  ],
  '/admin/faq': [
    'admin.category',
    'admin.confirmDelete',
    'admin.draft',
    'admin.faq',
    'admin.order',
    'admin.published',
    'admin.question',
    'admin.status'
  ],
  '/admin/faq/[id]/edit': [
    'admin.answer',
    'admin.basicInfo',
    'admin.category',
    'admin.order',
    'admin.published',
    'admin.question',
    'admin.removeTranslation',
    'admin.slug'
  ],
  '/admin/faq/create': [
    'admin.answer',
    'admin.basicInfo',
    'admin.category',
    'admin.order',
    'admin.published',
    'admin.question',
    'admin.slug'
  ],
  '/admin/features': [
    'admin.category',
    'admin.confirmDelete',
    'admin.draft',
    'admin.features',
    'admin.order',
    'admin.published',
    'admin.status',
    'admin.title'
  ],
  '/admin/features/[id]/edit': [
    'admin.basicInfo',
    'admin.category',
    'admin.description',
    'admin.hoverImageUrl',
    'admin.imageUrl',
    'admin.order',
    'admin.published',
    'admin.removeTranslation',
    'admin.slug',
    'admin.title'
  ],
  '/admin/features/create': [
    'admin.basicInfo',
    'admin.category',
    'admin.description',
    'admin.hoverImageUrl',
    'admin.imageUrl',
    'admin.order',
    'admin.published',
    'admin.slug',
    'admin.title'
  ],
  '/admin/health': [
    'admin.health',
    'admin.healthPage.action',
    'admin.healthPage.appVersion',
    'admin.healthPage.auditTrail',
    'admin.healthPage.buildVersion',
    'admin.healthPage.builtAt',
    'admin.healthPage.environment',
    'admin.healthPage.externalMonitoring',
    'admin.healthPage.failed',
    'admin.healthPage.ipAddress',
    'admin.healthPage.lastUpdated',
    'admin.healthPage.monitoringUnavailable',
    'admin.healthPage.noAuditEvents',
    'admin.healthPage.noLogs',
    'admin.healthPage.node',
    'admin.healthPage.openUptimeKuma',
    'admin.healthPage.opsNoProblems',
    'admin.healthPage.opsTitle',
    'admin.healthPage.opsUnavailable',
    'admin.healthPage.recentLogs',
    'admin.healthPage.releaseInfo',
    'admin.healthPage.status',
    'admin.healthPage.status.degraded',
    'admin.healthPage.status.error',
    'admin.healthPage.status.ok',
    'admin.healthPage.status.unavailable',
    'admin.healthPage.status.unhealthy',
    'admin.healthPage.status.warning',
    'admin.healthPage.success',
    'admin.healthPage.systemStatus',
    'admin.healthPage.time',
    'admin.healthPage.totalEvents',
    'admin.healthPage.uptime',
    ...HEALTH_CHECK_KEYS
  ],
  '/admin/legal': [
    'admin.legal',
    'admin.legalAvailableTokens',
    'admin.legalCompanyTitle',
    'admin.legalContactFormBlocked',
    'admin.legalContactFormBypassEnabled',
    'admin.legalContactFormReady',
    'admin.legalContactFormTitle',
    'admin.legalContactFormWithoutDocumentsDesc',
    'admin.legalDocumentBody',
    'admin.legalDocumentMissingBody',
    'admin.legalDocumentReady',
    'admin.legalDocumentsSubtitle',
    'admin.legalDocumentsTitle',
    'admin.legalEditMode',
    'admin.legalPageSubtitle',
    'admin.legalPreviewMode',
    'admin.legalSaveFailed'
  ],
  '/admin/portfolios': [
    'admin.confirmDelete',
    'admin.draft',
    'admin.editContent',
    'admin.name',
    'admin.portfolioSettings',
    'admin.portfolioType',
    'admin.portfolios',
    'admin.published',
    'admin.status'
  ],
  '/admin/portfolios/[id]/edit': [
    'admin.basicInfo',
    'admin.cardPreview',
    'admin.confirmRemoveImageMessage',
    'admin.confirmRemoveImageTitle',
    'admin.coverImage',
    'admin.coverImageHint',
    'admin.defaultLocaleHint',
    'admin.dropzoneLabel',
    'admin.replaceImage',
    'admin.description',
    'admin.editContent',
    'admin.fileTooLarge',
    'admin.localizedText',
    'admin.media',
    'admin.name',
    'admin.portfolioTextTooLong',
    'admin.portfolioType',
    'admin.publicationStatus',
    'admin.published',
    'admin.slug',
    'admin.uploadFailed',
    ...PORTFOLIO_TYPE_KEYS
  ],
  '/admin/portfolios/[id]/items': [
    'admin.addItem',
    'admin.addRow',
    'admin.caption',
    'admin.category',
    'admin.confirmDelete',
    'admin.description',
    'admin.dropzoneLabel',
    'admin.editItem',
    'admin.externalUrl',
    'admin.fileTooLarge',
    'admin.itemTitle',
    'admin.localizedText',
    'admin.mediaType',
    'admin.defaultLocaleHint',
    'admin.portfolioTextTooLong',
    'admin.noImage',
    'admin.noPortfolios',
    'admin.order',
    'admin.portfolioClientUrl',
    'admin.portfolioContent',
    'admin.portfolioImageUrl',
    'admin.portfolioItems',
    'admin.portfolioLiveUrl',
    'admin.portfolioMetadataInvalid',
    'admin.portfolioPages',
    'admin.portfolioPdfUrl',
    'admin.portfolioScreenshots',
    'admin.portfolioSections',
    'admin.portfolioSectionText',
    'admin.portfolioSectionTitle',
    'admin.portfolioTechnologies',
    'admin.published',
    'admin.removeRow',
    'admin.tags',
    'admin.uploadFailed',
    ...ITEM_TYPE_KEYS
  ],
  '/admin/portfolios/create': [
    'admin.basicInfo',
    'admin.cardPreview',
    'admin.confirmRemoveImageMessage',
    'admin.confirmRemoveImageTitle',
    'admin.coverImage',
    'admin.coverImageHint',
    'admin.description',
    'admin.dropzoneLabel',
    'admin.replaceImage',
    'admin.fileTooLarge',
    'admin.media',
    'admin.name',
    'admin.portfolioType',
    'admin.publicationStatus',
    'admin.published',
    'admin.slug',
    'admin.uploadFailed',
    ...PORTFOLIO_TYPE_KEYS
  ],
  '/admin/pricing': [
    'admin.confirmDelete',
    'admin.draft',
    'admin.featured',
    'admin.name',
    'admin.price',
    'admin.pricing',
    'admin.published',
    'admin.status'
  ],
  '/admin/pricing/[id]/edit': [
    'admin.basicInfo',
    'admin.ctaText',
    'admin.ctaUrl',
    'admin.currency',
    'admin.description',
    'admin.featured',
    'admin.features',
    'admin.name',
    'admin.order',
    'admin.period',
    'admin.periodMonth',
    'admin.periodOneTime',
    'admin.periodYear',
    'admin.price',
    'admin.published',
    'admin.slug'
  ],
  '/admin/pricing/create': [
    'admin.basicInfo',
    'admin.ctaText',
    'admin.ctaUrl',
    'admin.currency',
    'admin.description',
    'admin.featured',
    'admin.features',
    'admin.name',
    'admin.order',
    'admin.period',
    'admin.periodMonth',
    'admin.periodOneTime',
    'admin.periodYear',
    'admin.price',
    'admin.published',
    'admin.slug'
  ],
  '/admin/roles': [
    'admin.addRole',
    'admin.builtInRole',
    'admin.cannotDeleteBuiltIn',
    'admin.color',
    'admin.confirmDelete',
    'admin.confirmDeleteRole',
    'admin.description',
    'admin.editRole',
    'admin.level',
    'admin.name',
    'admin.noItems',
    'admin.permissions',
    'admin.roles',
    'admin.slug',
    'admin.slugImmutable',
    ...COLOR_OPTION_KEYS
  ],
  '/admin/security': ['admin.security'],
  '/admin/settings': [
    'admin.contactPageButtons',
    'admin.contactPageButtonsDesc',
    'admin.contactPageButtonsEmpty',
    'admin.failedSaveSettings',
    'admin.headerQuickContactIcons',
    'admin.headerQuickContactIconsDesc',
    'admin.headerQuickContactIconsEmpty',
    'admin.settings'
  ],
  '/admin/team': ['admin.hidden', 'admin.noItems', 'admin.published', 'admin.team'],
  '/admin/testimonials': ['admin.noItems', 'admin.testimonials'],
  '/admin/translations': [
    'admin.addItem',
    'admin.addTranslation',
    'admin.failedDeleteTranslation',
    'admin.failedLoadTranslations',
    'admin.failedSaveTranslation',
    'admin.noMatchesFound',
    'admin.noTranslations',
    'admin.searchTranslationsPlaceholder',
    'admin.translationContentPlaceholder',
    'admin.translationDeleteConfirm',
    'admin.translationDeleted',
    'admin.translationKey',
    'admin.translationKeyHint',
    'admin.translationSystemPlaceholder',
    'admin.translationValue',
    'admin.translationValuePlaceholder',
    'admin.translations',
    'admin.translationsAddingToContent',
    'admin.translationsAddingToSystem',
    'admin.translationsContent',
    'admin.translationsSubtitle',
    'admin.translationsSystem',
    'admin.translationsSystemPrefixHint',
    'admin.translationsSystemWarning',
    'admin.translationsSystemWarningDesc'
  ],
  '/admin/users': [
    'admin.addUser',
    'admin.confirmDelete',
    'admin.created',
    'admin.editUser',
    'admin.email',
    'admin.leaveBlankToKeep',
    'admin.locked',
    'admin.lockedAccount',
    'admin.name',
    'admin.noItems',
    'admin.password',
    'admin.roleColumn',
    'admin.unlock',
    'admin.users'
  ]
}

const SHELL_KEY_SET: Set<string> = new Set(ADMIN_SHELL_KEYS)

/**
 * The admin.* keys the given route needs: shell keys (admin layout nav) plus
 * the route's own page keys. Returns null for unknown routes so the caller can
 * degrade to the full map (correctness first — the drift-guard test requires
 * every admin page to be registered, so an unknown route means the registry
 * lags the page and the full map keeps labels correct until it is updated).
 */
export function getAdminKeysForRoute(routeId: string): Set<string> | null {
  const routeKeys = ROUTE_ADMIN_KEYS[routeId]
  if (!routeKeys) return null
  const keys = new Set<string>(SHELL_KEY_SET)
  for (const key of routeKeys) keys.add(key)
  return keys
}
