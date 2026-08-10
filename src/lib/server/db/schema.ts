/**
 * PM Database Schema — SQLite via Drizzle ORM
 *
 * Tables: users, sessions, roles, settings, portfolios, portfolio_items,
 *         contact_submissions, pricing_tiers, pricing_features,
 *         team_members, blog_posts, blog_categories, blog_tags, blog_media,
 *         clients, features, testimonials, faq_items, translations, audit_logs
 *
 * ≈31 tables with translations support for multi-locale (locales are
 * config-driven — see LOCALES in src/project/site-config.ts)
 */
import { sqliteTable, text, integer, unique, index } from 'drizzle-orm/sqlite-core'

// ═══════════════════════════════════════════════════════════════════════════
// USERS & AUTH
// ═══════════════════════════════════════════════════════════════════════════

export const USER_ROLES = ['master', 'admin', 'editor'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const ADMIN_PAGE_IDS = [
  'dashboard', 'users', 'roles', 'translations', 'settings', 'legal', 'health', 'logs',
  'sections', 'blog', 'portfolios', 'team', 'testimonials',
  'faq', 'clients', 'pricing', 'features', 'contacts', 'audit', 'security'
] as const
export type AdminPageId = (typeof ADMIN_PAGE_IDS)[number]
export type RolePermissions = Partial<Record<AdminPageId, boolean>>

export const ROLE_COLORS = ['primary', 'secondary', 'warning', 'success', 'danger'] as const
export type RoleColor = (typeof ROLE_COLORS)[number]

export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  permissions: text('permissions').notNull(),
  level: integer('level').notNull().default(0),
  isBuiltIn: integer('is_built_in', { mode: 'boolean' }).default(false),
  color: text('color').default('secondary'),
  icon: text('icon').default('pencil'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role', { enum: ['master', 'admin', 'editor'] }).default('editor').notNull(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'set null' }),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  lastFailedLogin: integer('last_failed_login', { mode: 'timestamp' }),
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false),
  // First-login hardening: true when the account was bootstrapped/rotated with
  // an operator-provided credential that must be changed before normal access.
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  index('sessions_user_expires_idx').on(table.userId, table.expiresAt),
  index('sessions_expires_idx').on(table.expiresAt)
])

export const user2fa = sqliteTable('user_2fa', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').notNull(),
  backupCodesRemaining: integer('backup_codes_remaining').default(10),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('user_2fa_user_idx').on(table.userId)])

// ═══════════════════════════════════════════════════════════════════════════
// SITE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  type: text('type', { enum: ['string', 'number', 'boolean', 'json'] }).default('string').notNull(),
  group: text('group').default('general'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT: PORTFOLIOS
// ═══════════════════════════════════════════════════════════════════════════

export const PORTFOLIO_TYPES = ['gallery', 'case_study'] as const
export type PortfolioType = (typeof PORTFOLIO_TYPES)[number]
export const PORTFOLIO_ITEM_SUBTYPES = ['branding', 'brandbook', 'website'] as const
export type PortfolioItemSubtype = (typeof PORTFOLIO_ITEM_SUBTYPES)[number]
export const PORTFOLIO_ITEM_TYPES = ['image', 'video', 'link', 'case_study'] as const
export type PortfolioItemType = (typeof PORTFOLIO_ITEM_TYPES)[number]

export const portfolios = sqliteTable('portfolios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['gallery', 'case_study', 'branding', 'brandbook', 'website'] }).notNull(),
  coverImageUrl: text('cover_image_url'),
  coverThumbnailUrl: text('cover_thumbnail_url'),
  order: integer('order').default(0),
  published: integer('published', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('portfolios_published_idx').on(table.published)])

export const portfolioItems = sqliteTable('portfolio_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  portfolioId: integer('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  itemType: text('item_type', { enum: ['image', 'video', 'link', 'case_study'] }).notNull(),
  order: integer('order').default(0),
  published: integer('published', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  mediaUrl: text('media_url'),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption'),
  slug: text('slug'),
  title: text('title'),
  description: text('description'),
  content: text('content'),
  tags: text('tags'),
  category: text('category'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  metadata: text('metadata')
}, table => [index('portfolio_items_portfolio_idx').on(table.portfolioId)])

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════════════════════════

export const contactSubmissions = sqliteTable('contact_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject'),
  message: text('message').notNull(),
  consent: integer('consent', { mode: 'boolean' }).default(false),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ═══════════════════════════════════════════════════════════════════════════
// PRICING
// ═══════════════════════════════════════════════════════════════════════════

export const PRICING_PERIODS = ['month', 'year', 'one-time'] as const
export type PricingPeriod = (typeof PRICING_PERIODS)[number]

export const pricingTiers = sqliteTable('pricing_tiers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  price: integer('price'),
  currency: text('currency').default('USD'),
  period: text('period', { enum: ['month', 'year', 'one-time'] }).default('month'),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  ctaText: text('cta_text'),
  ctaUrl: text('cta_url').default('/contact'),
  order: integer('order').default(0),
  published: integer('published', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const pricingFeatures = sqliteTable('pricing_features', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tierId: integer('tier_id').notNull().references(() => pricingTiers.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  included: integer('included', { mode: 'boolean' }).default(true),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('pricing_features_tier_idx').on(table.tierId)])

export const pricingTierTranslations = sqliteTable('pricing_tier_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tierId: integer('tier_id').notNull().references(() => pricingTiers.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name'),
  description: text('description'),
  ctaText: text('cta_text'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.tierId, table.locale),
  index('pricing_tier_translations_tier_idx').on(table.tierId)
])

export const pricingFeatureTranslations = sqliteTable('pricing_feature_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  featureId: integer('feature_id').notNull().references(() => pricingFeatures.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  text: text('text'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.featureId, table.locale),
  index('pricing_feature_translations_feature_idx').on(table.featureId)
])

// ═══════════════════════════════════════════════════════════════════════════
// TEAM
// ═══════════════════════════════════════════════════════════════════════════

export const teamMembers = sqliteTable('team_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  position: text('position'),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  hoverPhotoUrl: text('hover_photo_url'),
  email: text('email'),
  phone: text('phone'),
  department: text('department'),
  socialLinks: text('social_links'),
  published: integer('published', { mode: 'boolean' }).default(true),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('team_members_published_idx').on(table.published)])

export const teamMemberTranslations = sqliteTable('team_member_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => teamMembers.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  position: text('position'),
  bio: text('bio'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.memberId, table.locale),
  index('team_member_translations_member_idx').on(table.memberId)
])

// ═══════════════════════════════════════════════════════════════════════════
// BLOG
// ═══════════════════════════════════════════════════════════════════════════

export const blogCategories = sqliteTable('blog_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const blogCategoryTranslations = sqliteTable('blog_category_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => blogCategories.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.categoryId, table.locale),
  index('blog_category_translations_category_idx').on(table.categoryId)
])

export const blogTags = sqliteTable('blog_tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

export const blogPosts = sqliteTable('blog_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  categoryId: integer('category_id').references(() => blogCategories.id, { onDelete: 'set null' }),
  coverImageUrl: text('cover_image_url'),
  coverImageAlt: text('cover_image_alt'),
  published: integer('published', { mode: 'boolean' }).default(false),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  readingTimeMinutes: integer('reading_time_minutes'),
  viewCount: integer('view_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  index('blog_posts_published_idx').on(table.published),
  index('blog_posts_author_idx').on(table.authorId),
  index('blog_posts_category_idx').on(table.categoryId)
])

export const blogPostTranslations = sqliteTable('blog_post_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.postId, table.locale),
  index('blog_post_translations_post_idx').on(table.postId)
])

export const blogPostTags = sqliteTable('blog_post_tags', {
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => blogTags.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  index('blog_post_tags_post_idx').on(table.postId),
  index('blog_post_tags_tag_idx').on(table.tagId)
])

export const blogMedia = sqliteTable('blog_media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['image', 'video'] }).notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  alt: text('alt'),
  width: integer('width'),
  height: integer('height'),
  sizeBytes: integer('size_bytes'),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('blog_media_post_idx').on(table.postId)])

// ═══════════════════════════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════════════════════════

export const CLIENT_CATEGORIES = ['client', 'sponsor', 'partner'] as const
export type ClientCategory = (typeof CLIENT_CATEGORIES)[number]

export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  logoUrl: text('logo_url').notNull(),
  websiteUrl: text('website_url'),
  category: text('category', { enum: ['client', 'sponsor', 'partner'] }).default('client'),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  published: integer('published', { mode: 'boolean' }).default(true),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('clients_published_idx').on(table.published)])

// ═══════════════════════════════════════════════════════════════════════════
// FEATURES
// ═══════════════════════════════════════════════════════════════════════════

export const features = sqliteTable('features', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  imageUrl: text('image_url'),
  hoverImageUrl: text('hover_image_url'),
  category: text('category'),
  published: integer('published', { mode: 'boolean' }).default(true),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('features_published_idx').on(table.published)])

export const featureTranslations = sqliteTable('feature_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  featureId: integer('feature_id').notNull().references(() => features.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.featureId, table.locale),
  index('feature_translations_feature_idx').on(table.featureId)
])

// ═══════════════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════════════

export const testimonials = sqliteTable('testimonials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorName: text('author_name').notNull(),
  authorTitle: text('author_title'),
  authorCompany: text('author_company'),
  authorPhotoUrl: text('author_photo_url'),
  rating: integer('rating'),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  published: integer('published', { mode: 'boolean' }).default(true),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('testimonials_published_idx').on(table.published)])

export const testimonialTranslations = sqliteTable('testimonial_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  testimonialId: integer('testimonial_id').notNull().references(() => testimonials.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  quote: text('quote').notNull(),
  authorTitle: text('author_title'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.testimonialId, table.locale),
  index('testimonial_translations_testimonial_idx').on(table.testimonialId)
])

// ═══════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════

export const faqItems = sqliteTable('faq_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  category: text('category'),
  published: integer('published', { mode: 'boolean' }).default(true),
  order: integer('order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [index('faq_items_published_idx').on(table.published)])

export const faqItemTranslations = sqliteTable('faq_item_translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  faqItemId: integer('faq_item_id').notNull().references(() => faqItems.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  unique().on(table.faqItemId, table.locale),
  index('faq_item_translations_faq_idx').on(table.faqItemId)
])

// ═══════════════════════════════════════════════════════════════════════════
// TRANSLATIONS (DB-driven i18n)
// ═══════════════════════════════════════════════════════════════════════════

export const translations = sqliteTable('translations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  locale: text('locale').notNull(),
  key: text('key').notNull(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [unique().on(table.locale, table.key)])

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════════════

export const AUDIT_ACTIONS = [
  'login', 'login_failed', 'logout', 'password_change',
  'role_change', 'user_create', 'user_update', 'user_delete',
  'account_locked', 'account_unlocked', 'session_expired',
  'role_create', 'role_update', 'role_delete',
  'settings_update', 'terminal_command', 'ops_action', 'support_bundle_export',
  '2fa_enabled', '2fa_disabled', '2fa_verified', '2fa_failed'
] as const
export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  targetUserId: integer('target_user_id').references(() => users.id, { onDelete: 'set null' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  details: text('details'),
  success: integer('success', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
}, table => [
  index('audit_logs_created_idx').on(table.createdAt),
  index('audit_logs_action_idx').on(table.action)
])
