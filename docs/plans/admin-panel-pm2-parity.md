# Admin Panel PM2 Parity — Architecture & Implementation Plan

**Date:** 2026-08-11
**Status:** Proposed
**Source (PM v2 reference):** `docs/archive/pm-v2/guides/admin-guide.md`
**Target:** PM v3 SvelteKit (current)

---

## Executive Summary

The PM v3 admin panel has working auth, RBAC, layout, and API routes — but **zero editing UI** for the three most critical admin functions: translations, settings, and legal pages. Every page renders read-only tables with `—` in the Actions column. Styling is inconsistent across pages (some use tables, some use cards, some use grids) with no shared admin component library. There are **47 admin pages** but they share no reusable UI primitives.

This plan delivers PM2-level admin functionality through:
1. A shared admin component library (6 new molecules)
2. Full translations management with locale tabs, inline editing, search, and type classification
3. Full settings management with grouped views and type-aware inputs
4. Legal page CRUD with markdown editor
5. Consistent styling across all admin pages

---

## Current State Assessment (Evidence-Based)

### What Works
| Capability | Status | Evidence |
|-----------|--------|----------|
| Auth (login, 2FA, session) | ✅ | `admin/login`, `admin/change-password`, `server/auth/` |
| RBAC (role-based page gates) | ✅ | `admin-rbac.ts`, `ADMIN_PAGE_DEFS`, layout server |
| Admin layout (3 modes) | ✅ | `+layout.svelte` (289 lines, vertical/horizontal/mobile) |
| Entity CRUD APIs | ✅ | 37 API endpoints for blog/faq/features/pricing/portfolio/etc. |
| Entity CRUD admin pages | ✅ | Portfolios, Blog, Features, FAQ, Pricing — full list/create/edit |
| Settings API (GET/PUT) | ✅ | `api/admin/settings/+server.ts` |
| Translations API (GET/PUT) | ✅ | `api/admin/translations/+server.ts` + `[locale]/+server.ts` |
| Settings service layer | ✅ | `services/settings.ts` — `setSetting()`, `getAllSettings()` |
| Translations service layer | ✅ | `services/translations.ts` — `setTranslation()`, `deleteTranslation()` |
| Settings schema | ✅ | `settings-schema.ts` — 95 definitions, 9 groups, 4 types |
| Legal docs infrastructure | ✅ | `legal-documents.ts` — filesystem reads, fallback chain |
| CSRF protection | ✅ | `csrf.ts`, cookie+header pattern |
| Audit logging | ✅ | `server/audit/`, settings updates logged |

### What's Broken / Missing
| Gap | Severity | Current State | PM2 Behavior |
|-----|----------|---------------|--------------|
| Translations editing UI | 🔴 Critical | Read-only table, 100-row limit, no locale filter, no edit/delete | Locale tabs, inline editing, add/delete, system vs content types |
| Settings editing UI | 🔴 Critical | Read-only table, all fields show `—` in Actions column | Grouped forms, type-aware inputs, save per-field |
| Legal page admin | 🔴 Critical | Route doesn't exist (`admin/legal/` absent) | Full legal document editor |
| Admin component library | 🔴 Critical | Zero shared admin UI components | (PM2: admin-header.css, admin-sidebar.css, bottom-nav.css) |
| Styling consistency | 🔴 Critical | 4 different layout patterns across pages | Consistent admin page structure |
| User management UI | 🟡 High | Role `<select>` only — no create/edit/delete/reset-password | Full user CRUD, password reset, unlock |
| Blog/portfolio content editing | 🟡 High | Slug-only forms — no body content, no image upload | Rich text, image management |
| Audit log filtering | 🟡 High | 100 most recent only, no filter/search | Search, date range, action filter |
| Pagination | 🟡 Medium | Hardcoded limits (100 records) | Proper offset-based pagination |
| Dashboard analytics | 🟡 Medium | 4 stat cards only | Full stats, charts, recent activity |

---

## Scope

### In Scope (this plan)
1. **Admin component library** — shared molecules for consistent pages
2. **Translations admin** — full editing UI
3. **Settings admin** — full editing UI
4. **Legal pages admin** — new route + CRUD
5. **Styling normalization** — retrofit existing pages to use shared components

### Out of Scope (separate plan)
- User management CRUD (create/edit/delete/reset-password)
- Blog/portfolio content editing (rich text, image upload)
- Audit log filtering/search
- Pagination infrastructure
- Dashboard analytics

---

## ADR-001: Admin Component Strategy

### Status: Proposed

### Context
All 20+ admin pages currently render their own page header, data table, empty states, and forms. There is no shared admin component library — each page reimplements the same visual patterns with slight (often inconsistent) variations:

- **Page header pattern**: 16 pages use `flex items-center justify-between gap-4 py-4 mb-6 border-b border-pm-border` — 5 different HTML structures
- **Table pattern**: 6 pages use `bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden` — 4 different table header variations
- **Form pattern**: blog create uses SvelteKit form actions; portfolio create has broken `fail()` (I-10); no shared form field component
- **Empty state**: 8 pages check `items.length === 0` with identical markup

### Decision
Create a set of admin-specific molecule components under `src/lib/components/admin/`:

| Component | Responsibility | Consumers |
|-----------|---------------|-----------|
| `AdminPageHeader.svelte` | Page title + actions + item count | All 20+ admin pages |
| `AdminDataTable.svelte` | Sortable, searchable data table with slots | Settings, Translations, Users, Audit, Health, Roles, Contacts |
| `AdminFormField.svelte` | Label + input + error message | All admin forms |
| `AdminTabs.svelte` | Tab navigation (locale switching) | Translations, Legal |
| `AdminEmptyState.svelte` | Consistent empty state message | All list pages |
| `AdminBadge.svelte` | Status badge (published/draft/OK/error) | Blog, Health, Users |

### Options Considered
1. **Shared CSS classes** — violates PM3 rule #2 (tokens + Svelte components ONLY, no BEM)
2. **Utility-first inline Tailwind only** — current state; leads to copy-paste drift and inconsistency
3. **Admin component library** ✅ — follows PM3 component hierarchy (atoms/molecules/complex)

### Consequences
- **Easier**: Consistent admin UX, single point of change for admin styling, reduced code duplication (~200+ lines eliminated)
- **Harder**: Migration requires touching every admin page (mechanical, not risky)
- **Risk**: Components must remain flexible enough for varied use cases (mitigated by slot-based design)

---

## ADR-002: Translation Storage Architecture

### Status: Proposed

### Context
PM2 had two translation types: **System** (navigation, buttons, labels — managed by developers) and **Content** (headings, paragraphs, CTA text — managed by editors). PM3's translations table has no `type` column — all translations are in one flat table.

The user explicitly stated: "in original pm2 we have two types - system and non system translations."

The current `admin/+layout.server.ts` loads both `admin.*` and `content.*` keys into the same `t` map and sends them to the layout, meaning admin UI strings come from the translations table (DB-driven) rather than static catalog files.

### Decision
Add a `type` column to the translations table with values `'system' | 'content'`, defaulting to `'content'`. Classification rule:
- `system`: keys prefixed with `admin.`, `nav.`, `common.`, `auth.`, `validation.`, `footer.`, `error.`
- `content`: everything else (hero, sections, CTA, etc.)

The translations admin UI shows a type filter and respects the RBAC rule: editors can edit `content` translations; only admins/masters can edit `system` translations.

### Options Considered
1. **Key prefix convention** (no DB column) — fragile, relies on naming discipline, harder to query/filter
2. **Separate tables** (`system_translations`, `content_translations`) — over-normalized, complicates joins
3. **Type column** ✅ — simple, queryable, backward-compatible (existing rows default to `'content'`)

### Consequences
- **Easier**: UI can filter by type, RBAC can enforce per-type access, migration is a single ALTER TABLE
- **Harder**: Requires DB migration + seed update
- **Risk**: Existing admin translations loaded via `LAYOUT_KEYS` array must be reclassified (mitigated: we add `type: 'system'` to all `admin.*` keys in seed)

---

## ADR-003: Legal Pages — DB vs Filesystem

### Status: Proposed

### Context
PM3 legal documents are stored as **markdown files on disk**: `/legal/{locale}/{slug}.md`. Three documents exist: `privacy-policy`, `personal-data-policy`, `terms-of-service`. There is no admin UI to edit them.

PM2 had a legal page editor (evidenced by PM2 admin guide and `ADMIN_PAGE_DEFS` entry for `legal`).

### Decision
Move legal documents from filesystem to the **existing `section_content` table** or a new `legal_documents` table, with a `locale` column for per-language content. The admin editor provides a textarea with markdown preview. The public-facing legal page renders the DB content.

**Filesystem remains as the seed source only** — on `db:reset`, the markdown files are read and inserted into the DB.

### Options Considered
1. **Filesystem-only, admin writes to disk** — fragile (file permissions, Docker volumes), no audit log, hard to sync across instances
2. **DB-backed, filesystem as fallback** ✅ — auditable, multi-instance safe, admin-editable, files still serve as seed/default content
3. **Headless CMS integration** — over-engineered for 3 documents, adds external dependency

### Consequences
- **Easier**: Admin editing, audit trail, multi-instance safety
- **Harder**: Migration script needed to import existing markdown files into DB
- **Risk**: Public legal page must handle DB unavailability (mitigated: keep filesystem fallback in `readLegalDocument()`)

---

## C4 Level 2 — Admin Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Admin User)                                       │
│  /admin/*                                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  SvelteKit Server (PM v3)                                    │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Admin Routes (src/routes/admin/)                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │  │
│  │  │Settings  │ │Translat. │ │Legal     │ │Users    │  │  │
│  │  │Page      │ │Page      │ │Page      │ │Page     │  │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘  │  │
│  │       │            │            │            │        │  │
│  │  ┌────┴────────────┴────────────┴────────────┴─────┐  │  │
│  │  │  Admin Component Library (src/lib/components/   │  │  │
│  │  │  admin/)                                         │  │  │
│  │  │  AdminPageHeader | AdminDataTable | AdminTabs   │  │  │
│  │  │  AdminFormField  | AdminBadge     | AdminEmpty  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │       │                                                │  │
│  │  ┌────┴────────────────────────────────────────────┐  │  │
│  │  │  Admin Layout (+layout.svelte, +layout.server)  │  │  │
│  │  │  Auth guard, RBAC menu, CSRF, unread count       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Admin API Routes (src/routes/api/admin/)             │  │
│  │  /translations    GET, PUT, DELETE                    │  │
│  │  /settings        GET, PUT, PUT (single)              │  │
│  │  /legal           GET, POST, PUT, DELETE              │  │
│  │  Requires: RBAC guard, Zod validation, CSRF           │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │  Service Layer (src/lib/server/services/)             │  │
│  │  translations.ts  — setTranslation, deleteTranslation │  │
│  │  settings.ts      — setSetting, getAllSettings        │  │
│  │  legal.ts         — NEW: CRUD for legal_documents     │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │  SQLite Database (data/sqlite.db)                     │  │
│  │  translations  settings  legal_documents  users  ...  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Admin Component Library (Foundation)

**Dependency**: None — everything else depends on these components.

#### US-001: Create AdminPageHeader molecule
- **File**: `src/lib/components/admin/AdminPageHeader.svelte`
- **Props**: `title: string`, `itemCount?: number`, `actions?: Snippet`
- **Slots**: `actions` for buttons (create, filter, etc.)
- **States**: with count, without count, with actions, without actions
- **Design tokens**: `--color-pm-text`, `--color-pm-text-muted`, `--color-pm-border`
- **i18n**: All labels via `t()`

#### US-002: Create AdminDataTable molecule
- **File**: `src/lib/components/admin/AdminDataTable.svelte`
- **Props**: `columns: Array<{key: string, label: string, sortable?: boolean}>`, `items: T[]`, `emptyMessage: string`
- **Slots**: `cell-{key}` for custom cell rendering, `actions` for per-row actions
- **States**: loading (skeleton rows), empty, error, data
- **Features**: sortable headers, striped rows, hover states

#### US-003: Create AdminFormField molecule
- **File**: `src/lib/components/admin/AdminFormField.svelte`
- **Props**: `label: string`, `name: string`, `type?: 'text'|'email'|'password'|'textarea'|'checkbox'|'number'`, `error?: string`, `required?: boolean`
- **Bind**: `value`
- **States**: normal, focused, error, disabled

#### US-004: Create AdminTabs molecule
- **File**: `src/lib/components/admin/AdminTabs.svelte`
- **Props**: `tabs: Array<{id: string, label: string}>`, `active: string`
- **Events**: `onchange` (dispatch tab id)

#### US-005: Create AdminEmptyState molecule
- **File**: `src/lib/components/admin/AdminEmptyState.svelte`
- **Props**: `message: string`, `actionLabel?: string`
- **Events**: `onaction`

#### US-006: Create AdminBadge molecule
- **File**: `src/lib/components/admin/AdminBadge.svelte`
- **Props**: `label: string`, `variant: 'success'|'danger'|'warning'|'info'|'neutral'`

### Phase 2: Translations Admin (Core Gap)

**Dependencies**: Phase 1 (AdminPageHeader, AdminDataTable, AdminTabs, AdminBadge, AdminEmptyState)

#### US-007: Add `type` column to translations table
- **DB migration**: `ALTER TABLE translations ADD COLUMN type TEXT NOT NULL DEFAULT 'content' CHECK(type IN ('system', 'content'))`
- **Schema update**: `src/lib/server/db/schema.ts` — add `type` to translations table definition
- **Seed update**: `npm run db:seed` — classify existing translations, add missing system translations

#### US-008: Rebuild translations admin page
- **File**: `src/routes/admin/translations/+page.svelte` (rewrite)
- **Layout**: AdminPageHeader + AdminTabs (by locale) + AdminDataTable
- **Features**:
  - Locale tabs: EN, RU (from `LOCALE_STRINGS`)
  - Type filter: All / System / Content
  - Search by key
  - Inline editing: click cell → input → save/cancel
  - Add translation: button → modal with key + value form
  - Delete translation: per-row delete button with confirmation
  - System translations: locked for editor role, editable for admin/master
- **File**: `src/routes/admin/translations/+page.server.ts` (rewrite)
  - Load all translations (remove 100-row limit, add pagination)
  - Return locale list from config

#### US-009: Add translation CRUD API endpoints
- **File**: `src/routes/api/admin/translations/+server.ts` (extend)
  - Add: `POST` — create new translation key
- **File**: `src/routes/api/admin/translations/[locale]/+server.ts` (extend)
  - Add: `DELETE` with `{ key }` body — delete single translation
  - Existing: `PUT` with `{ key: value }` map (no change needed)
- **File**: `src/routes/api/admin/translations/[locale]/[key]/+server.ts` (NEW)
  - `GET` — get single translation
  - `PUT` — update single translation (alternative to bulk PUT)

### Phase 3: Settings Admin (Core Gap)

**Dependencies**: Phase 1 (AdminPageHeader, AdminFormField, AdminBadge, AdminEmptyState)

#### US-010: Rebuild settings admin page
- **File**: `src/routes/admin/settings/+page.svelte` (rewrite)
- **Layout**: AdminPageHeader + grouped sections (cards) + AdminFormField per setting
- **Features**:
  - Grouped view: Contact, Social, Legal, Integrations, SEO, Footer, Analytics, Verification
  - Type-aware inputs: text→text input, boolean→checkbox, number→number, json→textarea
  - Sensitive fields: masked with reveal toggle (tokens, chat IDs)
  - Per-field save button (optimistic update)
  - Success/error feedback per field
  - Group expand/collapse
- **File**: `src/routes/admin/settings/+page.server.ts` (rewrite)
  - Load settings with schema metadata (type, label, icon)
  - Return grouped structure for the UI

#### US-011: Add single-setting update API endpoint
- **File**: `src/routes/api/admin/settings/[key]/+server.ts` (NEW)
  - `PUT` — update single setting with type-aware validation
  - Requires: Zod schema per type, audit logging

### Phase 4: Legal Pages Admin (Missing Route)

**Dependencies**: Phase 1 (AdminPageHeader, AdminFormField, AdminEmptyState, AdminTabs)

#### US-012: Create legal_documents table + service
- **DB migration**: new `legal_documents` table: `id`, `slug`, `locale`, `title`, `content` (text), `created_at`, `updated_at`
- **Schema**: `src/lib/server/db/schema.ts` — add table definition
- **Service**: `src/lib/server/services/legal.ts` (NEW) — `getLegalDocuments()`, `getLegalDocument()`, `upsertLegalDocument()`, `deleteLegalDocument()`
- **Seed**: Import existing `/legal/{locale}/{slug}.md` files into DB on `db:reset`

#### US-013: Create legal pages admin route
- **File**: `src/routes/admin/legal/+page.svelte` (NEW)
- **Layout**: AdminPageHeader + AdminTabs (by locale) + document list + editor
- **Features**:
  - Document list: privacy-policy, personal-data-policy, terms-of-service
  - Per-document editor: title input + markdown textarea + preview toggle
  - Per-locale editing (EN/RU tabs)
  - Save button with CSRF
- **File**: `src/routes/admin/legal/+page.server.ts` (NEW)
  - Load legal documents for current locale
  - Form action for saving

#### US-014: Create legal pages API
- **File**: `src/routes/api/admin/legal/+server.ts` (NEW)
  - `GET` — list all legal documents (optionally filtered by locale)
- **File**: `src/routes/api/admin/legal/[slug]/+server.ts` (NEW)
  - `GET` — get document by slug + locale
  - `PUT` — update document content
  - `DELETE` — delete document

#### US-015: Update legal-documents.ts to use DB with filesystem fallback
- **File**: `src/lib/utils/legal-documents.ts` (modify)
  - `readLegalDocument()`: try DB first, fall back to filesystem
  - `listLegalDocuments()`: try DB first, fall back to filesystem
  - Keep existing fallback chain (requested locale → DEFAULT_LOCALE → 'en')

### Phase 5: Styling Normalization

**Dependencies**: Phase 1 (all admin components must exist first)

#### US-016: Retrofit all admin pages to use shared components
- **Pages to update** (replace inline patterns with shared components):
  - `admin/+page.svelte` — Dashboard (use AdminPageHeader)
  - `admin/users/+page.svelte` — Use AdminPageHeader + AdminDataTable
  - `admin/roles/+page.svelte` — Use AdminPageHeader + AdminDataTable
  - `admin/settings/+page.svelte` — Already rewritten in Phase 3
  - `admin/translations/+page.svelte` — Already rewritten in Phase 2
  - `admin/audit/+page.svelte` — Use AdminPageHeader + AdminDataTable
  - `admin/health/+page.svelte` — Use AdminPageHeader + AdminDataTable
  - `admin/security/+page.svelte` — Use AdminPageHeader
  - `admin/blog/+page.svelte` — Use AdminPageHeader
  - `admin/blog/create/+page.svelte` — Use AdminFormField
  - `admin/portfolios/+page.svelte` — Use AdminPageHeader
  - `admin/faq/+page.svelte` — Use AdminPageHeader
  - `admin/features/+page.svelte` — Use AdminPageHeader
  - `admin/pricing/+page.svelte` — Use AdminPageHeader
  - `admin/contacts/+page.svelte` — Use AdminPageHeader + AdminDataTable
  - `admin/team/+page.svelte` — Use AdminPageHeader
  - `admin/testimonials/+page.svelte` — Use AdminPageHeader
  - `admin/clients/+page.svelte` — Use AdminPageHeader

#### US-017: Admin layout polish
- **File**: `src/routes/admin/+layout.svelte`
  - Add active page breadcrumb
  - Add page transition animation
  - Ensure consistent spacing in main content area
  - Fix mobile bottom nav truncation (show "More" for items beyond 8)

---

## Dependency Graph

```
Phase 1 (Foundation)
├── US-001 AdminPageHeader
├── US-002 AdminDataTable
├── US-003 AdminFormField
├── US-004 AdminTabs
├── US-005 AdminEmptyState
└── US-006 AdminBadge
     │
     ├── Phase 2 (Translations)
     │   ├── US-007 DB: type column + seed
     │   ├── US-008 Rebuild translations page
     │   └── US-009 Translation API endpoints
     │
     ├── Phase 3 (Settings)
     │   ├── US-010 Rebuild settings page
     │   └── US-011 Single-setting API
     │
     ├── Phase 4 (Legal Pages)
     │   ├── US-012 DB: legal_documents table + service + seed
     │   ├── US-013 Legal admin route
     │   ├── US-014 Legal API
     │   └── US-015 Update legal-documents.ts
     │
     └── Phase 5 (Normalization)
         ├── US-016 Retrofit all admin pages
         └── US-017 Layout polish
```

**Parallelizable**: Phase 2, 3, and 4 can run in parallel after Phase 1 completes.

---

## ISO 25010 Quality Attribute Evaluation

| Dimension | Current Risk | Post-Plan Risk | Notes |
|-----------|-------------|----------------|------|
| Functional Suitability | 🔴 High | ✅ Low | Missing editing UI is fundamentally incomplete |
| Reliability | ✅ Low | ✅ Low | No change — server-side auth/RBAC unchanged |
| Performance Efficiency | ✅ Low | ✅ Low | Client-side rendering only — no new server load |
| Usability | 🔴 High | ✅ Low | Read-only tables with `—` actions are confusing |
| Security | ✅ Low | ✅ Low | CSRF + RBAC + Zod validation already in place; new API endpoints follow same pattern |
| Compatibility | ✅ Low | ✅ Low | No breaking changes to existing API contracts |
| Maintainability | 🔴 High | ✅ Low | Shared components eliminate copy-paste drift |
| Portability | ✅ Low | ✅ Low | No new infrastructure dependencies |

---

## Edge Case Stress Test

| Scenario | Handling |
|----------|----------|
| Empty translations table | AdminEmptyState shows "No translations yet. Add one to get started." |
| Single locale (only EN) | AdminTabs hides when only 1 locale; shows all content in single view |
| Editor tries to edit system translation | Form field disabled with tooltip: "System translations require admin role" |
| Concurrent edits to same translation | Last-write-wins (SQLite); optimistic update shows immediate feedback |
| Save fails (network error) | Error state per field; value preserved; retry button |
| Very long translation value (>1000 chars) | textarea in edit mode, truncated with expand in table view |
| Sensitive setting revealed in screenshot | Masked by default; reveal toggle is per-field, not global |
| Legal document deleted that footer links to | Footer checks DB availability; hides link if document missing |
| DB migration fails | Rollback path documented; migration is additive (ALTER TABLE ADD COLUMN) |
| TypeScript compilation after schema change | Drizzle schema updated first; `npm run check` verifies before any UI work |

---

## Verification Checklist

### Phase 1 — Admin Components
- [ ] `npm run check` passes after each component created
- [ ] AdminPageHeader renders correctly in all 3 modes (vertical/horizontal/mobile)
- [ ] AdminDataTable handles 0, 1, 10, 100 rows without layout break
- [ ] AdminFormField renders all 5 input types correctly
- [ ] AdminTabs keyboard-navigable (Tab, Enter, arrow keys)
- [ ] AdminBadge renders all 5 variants with correct colors

### Phase 2 — Translations
- [ ] DB migration runs without errors: `npm run db:reset`
- [ ] Translations page shows locale tabs for EN and RU
- [ ] Type filter (All/System/Content) works correctly
- [ ] Inline edit: click cell → input appears → type → save → DB updated
- [ ] Inline edit: ESC or click-away cancels without saving
- [ ] Add translation: modal opens → fill key+value → save → appears in table
- [ ] Delete translation: confirm dialog → delete → row removed
- [ ] Editor role cannot edit `admin.*` system translations (field disabled)
- [ ] Search by key filters table correctly
- [ ] CSRF token present on all POST/PUT/DELETE requests
- [ ] Cache invalidated after save (content + translation caches)
- [ ] `npm run check` + `npm run lint` pass
- [ ] No type suppressions (`@ts-ignore`, `!`, `@ts-expect-error`)
- [ ] All user-facing strings use `t()` or `$page.data.t` — zero hardcoded text
- [ ] PM3 validator (pre-commit hook) passes

### Phase 3 — Settings
- [ ] Settings page shows grouped cards (Contact, Social, Legal, etc.)
- [ ] Type-aware inputs: checkbox for booleans, number for numbers, textarea for json
- [ ] Sensitive fields (tokens) masked by default with eye toggle
- [ ] Per-field save button works — single PUT, no page reload
- [ ] Save failure shows inline error, value preserved
- [ ] Group expand/collapse works
- [ ] `npm run check` + lint pass
- [ ] All strings i18n'd

### Phase 4 — Legal Pages
- [ ] DB migration creates legal_documents table
- [ ] Seed imports existing markdown files into DB
- [ ] `/admin/legal` route loads and shows document list
- [ ] Locale tabs switch between EN/RU content
- [ ] Markdown textarea edits save correctly
- [ ] Preview toggle shows rendered markdown
- [ ] Public legal page reads from DB (with filesystem fallback)
- [ ] Delete document: confirm → delete → list updates
- [ ] Footer legal links still work after migration
- [ ] `npm run check` + lint pass

### Phase 5 — Normalization
- [ ] All 18 admin pages use shared AdminPageHeader
- [ ] All table pages use shared AdminDataTable
- [ ] No remaining inline page header HTML in any admin page
- [ ] No remaining inline table HTML in any admin page
- [ ] Visual consistency: same spacing, same typography, same border styles across all pages
- [ ] `npm run build` succeeds
- [ ] `npm run check` passes with zero errors
- [ ] Full admin walkthrough: login → dashboard → settings edit → translations edit → legal edit → logout

---

## Migration Path

### Rollback Strategy
- All changes are additive — no existing functionality is removed
- New components coexist with old pages during retrofit (Phase 5)
- DB migrations are additive (new columns, new tables) — reversible with `ALTER TABLE ... DROP COLUMN`
- Legal documents: filesystem fallback preserved in `legal-documents.ts`

### Feature Flags
- No feature flags needed — the new admin UI replaces the old read-only UI directly
- If rollback is needed: revert the commit (no config changes required)

### Phased Rollout
1. **Phase 1 first** — deploy admin components (no user-facing change yet)
2. **Phases 2-4** can ship independently (translations first, then settings, then legal)
3. **Phase 5 last** — retrofit existing pages

---

## Trade-off Summary

| Trade-off | Chose | Rejected | Reason |
|-----------|-------|----------|--------|
| Translation types | `type` column in existing table | Key prefixes / separate tables | Queryable, backward-compatible, minimal schema change |
| Legal storage | DB with filesystem fallback | Filesystem-only / Headless CMS | Auditable, multi-instance safe, no external dependency |
| Admin UI patterns | Svelte components | CSS classes / inline Tailwind | PM3 rule #2, composition over duplication |
| Settings editing | Per-field save | Bulk save form | Lower data loss risk, better UX for 95 fields |
| API design | Extend existing API routes | Separate admin API surface | Reuses auth/RBAC/CSRF already in place |

---

## Notes

- The `npm run db:seed` must be updated to:
  1. Classify existing translations as system/content
  2. Add missing admin.* system translations for new UI strings
  3. Import legal markdown files into legal_documents table
- The `admin/+layout.server.ts` `LAYOUT_KEYS` array must be extended with new admin UI string keys
- All new API endpoints follow existing patterns: Zod validation, CSRF check, RBAC guard (`requireAdminPage`), audit logging
- The PM3 framework validator (pre-commit hook) must pass — no `@ts-ignore`, no empty catches, no raw string literals
