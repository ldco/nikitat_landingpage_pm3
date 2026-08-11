# Admin Panel — PM2 Parity Plan (Revised — Audit 2026-08-12)

> **Previous version** (now `admin-panel-pm2-exact-replication.md.bak`) marked all
> 9 phases ✅ complete. This version corrects the record against live code at
> `src/routes/admin/`, `src/lib/components/admin/`, and `src/project/site-config.ts`.

## Implementation note

PM2 class names and DOM shapes in this document are **reference inputs for
comparison** — they capture the visual layout, spacing, interaction states, and
mobile behavior to replicate. Implementation in PM3 follows the **component and
token rules in `AGENTS.md`**: design tokens (`--width-key-column`,
`--grid-admin-form`, etc.) in `src/app.css`, Svelte components, and Tailwind
utilities referencing those tokens. PM2 BEM class names (`.data-table`,
`.page-header`) are never recreated verbatim.

---

## Current PM3 baseline (audit against live implementation)

Each requirement is marked **Matched**, **Partial**, or **Missing** against the
present PM3 code in `src/routes/admin/`.

### Admin layout (`src/routes/admin/+layout.svelte`) — ⚠️ INCOMPLETE

**The admin panel uses APP MODE** (PM2's distinct visual paradigm for admin/app UIs),
NOT responsive CSS within a website layout. APP MODE is enabled whenever
`admin.enabled: true` — the admin IS app mode, not a third paradigm. PM3's
current implementation merges what PM2 separated into 3+ files (592 lines of
admin-header.css, 255 lines of bottom-nav.css, 74 lines of admin-sidebar.css,
plus AppBottomNav.vue) into a single 291-line layout with CSS breakpoint hacks.

| Requirement | Status | Notes |
|---|---|---|
| Desktop vertical sidebar (APP MODE) | Matched | 64px icon sidebar with tooltips (lines 122–168) |
| Desktop horizontal header (non-vertical-nav mode) | Matched | Icon nav with tooltips (lines 169–213) |
| Menu driven by `ADMIN_PAGE_DEFS` + `MODULES` | Matched | `getAuthorizedAdminPages()` drives both nav and auth |
| `mustChangePassword` redirect | Matched | Layout server redirects to `/admin/change-password` |
| Content area max-width 62.5rem (1000px) | Matched | `max-w-[var(--max-w-content)]` (line 285) |
| Unread count badge on contacts icon | Matched | `unreadCount` via `getCachedUnreadCount` → badge dot |
| CSRF token delivered via layout | Matched | `csrfToken` in layout data (line 73) |
| **Mobile APP MODE — bottom navigation** | 🔴 Missing | PM2 bottom-nav.css was 255 lines with scrollable category rows, hover effects, accessible items. PM3: 11 lines with `.slice(0, 8)` hard truncation, no categories, no scrollable rows, hidden on phone (<640px). In APP MODE, bottom nav should be THE primary mobile nav at ALL mobile sizes. |
| **Mobile APP MODE — header bar** | 🔴 Missing | PM2 mobile header had full user dropdown (name/email/role, theme/language toggles, change password, logout). PM3: just page title + initial avatar. |
| **Mobile APP MODE — drawer** | 🔴 Missing | PM2 drawer had icons + text (matching sidebar). PM3: text-only links, no icons. |
| **Tablet APP MODE — icon rail** | 🔴 Missing | PM2 had 80px icon-only rail on tablet (between phone bottom-nav and desktop sidebar). PM3: no tablet-specific layout — jumps from phone drawer to desktop sidebar. |
| **Breakpoint system** | 🔴 Wrong approach | PM2 used `--phone`/`--tablet`/`--desktop` custom media queries from breakpoints.css. PM3: ad-hoc Tailwind `sm:`/`lg:`/`md:` classes without programmatic breakpoint detection. |
| **AppBottomNav component** | 🔴 Missing | PM2 had `AppBottomNav.vue` as a separate molecule. PM3: bottom nav is inline in the layout — 11 Tailwind lines, not a proper component. |
| **User menu in horizontal mode** | ⚠️ Partial | Desktop horizontal header has user avatar + dropdown. But mobile variants are incomplete. |

**Summary**: The admin layout handles DESKTOP correctly (both vertical and horizontal modes).
The MOBILE APP MODE is a CSS afterthought layered onto the desktop layout, not a proper
APP MODE implementation. PM2 treated APP MODE mobile as a first-class citizen with
dedicated CSS files (592+255 lines). PM3's version is ~40 lines of breakpoint classes.

### Translations page (`src/routes/admin/translations/+page.svelte`) — ✅ COMPLETE

| Requirement | Status | Notes |
|---|---|---|
| Page header with title + subtitle + Add button | Matched | `PageHeader` with `actions` snippet |
| Section toggle pills (Content/System) with counts | Matched | `section-toggle` buttons with per-section counts |
| System warning alert bar | Matched | `alert--warning` div when system section active |
| Locale tabs with per-locale counts | Matched | Border-bottom tabs with tab-badge counts |
| Search bar with icon | Matched | Search input with `IconSearch` |
| Namespace-grouped accordion cards | Matched | Grouped by first key segment with chevron toggle |
| Key column (35% width, `<code>` chip) | Matched | `w-[var(--width-key-column)]` with `<code>` |
| Click-to-edit → opens modal | Matched | `openEdit()` shows modal with key + per-locale fields |
| Add translation modal (key + all locales) | Matched | Batch endpoint `/api/admin/translations/batch` |
| Delete translation with confirm | Matched | `overlays.confirm()` + `DELETE` API |
| Server-side system-key authorization | Matched | `isSystemKey()` guard in all 4 API files (master/admin only) |
| UI convenience lock for editors on system rows | Matched | Lock icon + disabled edit/delete on system keys for editor |
| legalDocuments namespace hidden from content | Matched | `hiddenContentNamespaces` filter |

### Settings page (`src/routes/admin/settings/+page.svelte`) — ✅ COMPLETE

| Requirement | Status | Notes |
|---|---|---|
| Page header with title | Matched | `PageHeader` |
| Bulk save form (one submit button) | Matched | Single `CtaButton type="submit"` at bottom |
| Grouped cards with card-header/card-body | Matched | Section cards with separated header + 2-col grid body |
| 2-column form grid (auto-fit, minmax 280px) | Matched | `grid-cols-[var(--grid-admin-form)]` |
| Boolean → checkbox, string → input, json → textarea | Matched | Type-aware rendering |
| Contact header quick picker | Matched | Pill-style toggle buttons with brand icons for `headerQuickItems` |
| Contact page items picker | Matched | Second picker block for `contactPageItems` |
| Has-changes dirty guard on save | Matched | `hasChanges` derived + disabled button |
| settings.{key} i18n labels | Matched | `t(group.label)` for group titles, `t(item.label)` for fields |

### Legal page (`src/routes/admin/legal/+page.svelte`) — ✅ COMPLETE

| Requirement | Status | Notes |
|---|---|---|
| Page header with title + subtitle | Matched | `PageHeader` |
| Company details card (legal fields) | Matched | `legal.companyLegalName` … `legal.email` in form-grid |
| Contact form gate checkbox | Matched | `forceShowFormWithoutLegalDocuments` toggle |
| Status grid (one card per locale) | Matched | `grid-cols-[var(--grid-admin-status)]` per-locale cards |
| Locale tabs with warning indicators | Matched | Border-bottom tabs with warning dot for missing docs |
| Active locale status badges | Matched | Documents complete + contact form ready badges |
| Placeholder tokens display | Matched | Token chips for `{companyLegalName}` etc. |
| Per-document markdown editor | Matched | Textarea + preview toggle with `renderLegalMarkdown` |
| Combined settings + documents in one page | Matched | PM2 structure (single `/admin/legal` page) |
| Bulk save (settings + per-doc legal API) | Matched | Single save button bulk-PUTs settings + per-locale doc API |

### Users page (`src/routes/admin/users/+page.svelte`) — ✅ COMPLETE

| Requirement | Status | Notes |
|---|---|---|
| Page header with Add User button | Matched | `PageHeader` with `actions` snippet |
| Card wrapper with data table | Matched | `bg-pm-bg-elevated rounded-xl` card |
| Name / Email / Role badge / Created columns | Matched | `AdminDataTable` with 4 columns |
| Role badges (master=warning, admin=primary, editor=secondary) | Matched | PM2 `roleBadgeClass` colors |
| Date formatting (UTC, locale-aware) | Matched | `toLocaleDateString` with UTC timezone |
| Add user modal (email/password/name/role) | Matched | Modal with `formEmail`/`formPassword`/`formName`/`formRole` |
| Edit user modal (password optional, name editable) | Matched | `leaveBlankToKeep` placeholder |
| Delete with confirm | Matched | `overlays.confirm()` + `DELETE` API |
| Self-delete guard | Matched | Delete disabled for current user |
| Master-only guard for other masters | Matched | `canEdit(user)` check |

### System pages (dashboard, roles, audit, health, security)

| Page | Status | Notes |
|---|---|---|
| Dashboard (`admin/+page.svelte`) | ✅ Matched | 4 stat cards (users/portfolios/blog/contacts) on responsive grid |
| Audit (`admin/audit/+page.svelte`) | ✅ Matched | `AdminDataTable` showing action/user/date from `auditLogs` |
| Health (`admin/health/+page.svelte`) | ✅ Matched | `AdminDataTable` with OK/Error badges; returns `[string, string][]` tuples (fragile — should use typed objects) |
| Security (`admin/security/+page.svelte`) | ✅ Matched | Change password form + 2FA enable/disable with `TwoFactorSetup` |
| **Roles** (`admin/roles/+page.svelte`) | ⚠️ Read-only | `AdminDataTable` with name/slug/level/color. **No Create/Edit/Delete UI** despite `POST/PUT/DELETE /api/admin/roles/[id]` endpoints existing and working. 49 lines — list only. |

### Auth and account flows — ✅ COMPLETE

| Route | Status | Notes |
|---|---|---|
| Login (`admin/login/+page.svelte`) | Matched | Email/password + 2FA challenge flow + `rememberMe` |
| Change password (`admin/change-password/+page.svelte`) | Matched | Bootstrap hardening, password policy checks |

---

## Website module list pages — AUDIT (corrected)

### CRITICAL FINDING: Config-disabled modules

Three modules have fully implemented code (routes, API endpoints, forms) but are **disabled in config**, making them return 404:

| Module | Config Setting | Effect |
|--------|---------------|--------|
| Blog | `ADMIN_CONFIG.websiteModules.blog.enabled = false` | All `/admin/blog/**` routes return 404 |
| Pricing | `ADMIN_CONFIG.websiteModules.pricing.enabled = false` | All `/admin/pricing/**` routes return 404 |
| Contacts | `MODULES.contact.enabled = false` | Module gate overrides ADMIN_CONFIG; `/admin/contacts` returns 404 |

These are **dead code paths** until re-enabled in config. The plan previously listed them as active pages.

### List page audit (live code)

| Module | File | Config Status | Current State | Gaps |
|--------|------|--------------|---------------|------|
| **Portfolios** | `admin/portfolios/+page.svelte` (99 lines) | ✅ Enabled | `PageHeader` with Create CTA + `AdminDataTable` with Edit/Delete actions. **Gold standard — complete.** | None |
| **FAQ** | `admin/faq/+page.svelte` (38 lines) | ✅ Enabled | Card list without `AdminDataTable`. Shows only `slug` + `order` + published badge. **No Create CTA, no Edit/Delete buttons.** Create/edit form pages exist but user has no navigation to reach them. | Missing: Create button, edit/delete per item, `AdminDataTable` integration, display of actual question/answer/category |
| **Features** | `admin/features/+page.svelte` (35 lines) | ✅ Enabled | Card grid without `AdminDataTable`. Shows only `slug` + `order` + published badge. **No Create CTA, no Edit/Delete buttons.** | Missing: Create button, edit/delete per item, `AdminDataTable` integration, display of title/description/icon |
| **Blog** | `admin/blog/+page.svelte` (40 lines) | ❌ Disabled (404) | Card list. Shows only `slug` + published badge + empty 80×56px placeholder rectangle. No cover image, no title, no categories, no tags, no locale indicators, no actions. | Missing: everything the plan claims (cover image, title, categories, tags, locale indicators) + Create/Edit/Delete actions. Also: config must be enabled. |
| **Pricing** | `admin/pricing/+page.svelte` (32 lines) | ❌ Disabled (404) | Card grid. Shows `name` + `price` + `slug` + featured badge. Closest to target but still no actions. | Missing: Create/Edit/Delete actions. Config must be enabled. |
| **Team** | `admin/team/+page.svelte` (41 lines) | ❌ Disabled | Card grid. Shows name + position + published badge. **Intentionally read-only** — seeded from content.json. | None (by design) |
| **Testimonials** | `admin/testimonials/+page.svelte` (34 lines) | ❌ Disabled | Card grid. Shows author quote + company + rating. **Intentionally read-only.** | None (by design) |
| **Clients** | `admin/clients/+page.svelte` (33 lines) | ❌ Disabled | Card grid. Shows logo + name + website URL. **Intentionally read-only.** | None (by design) |
| **Contacts** | `admin/contacts/+page.svelte` (45 lines) | ❌ Disabled (module gate) | `AdminDataTable` with name/email/date. **Read-only inbox — no reply/mark-read/delete actions in UI** despite DELETE API existing. | Missing: delete action button, mark-as-read toggle. Config must be enabled. |

---

## Website module create/edit pages — AUDIT (corrected)

### CRITICAL FINDING: Minimal form fields

All create forms capture only `slug` (plus `order` for FAQ/Features, `name`/`price` for Pricing). The DB schema supports far richer entities via translation tables (`*_translations`), but the admin forms expose none of those fields.

| Entity | Create Form Fields | Missing Fields (in schema but not in form) |
|--------|--------------------|---------------------------------------------|
| Blog | `slug` only | `categoryId`, `coverImageUrl`, `published` toggle; translation fields: `title`, `content`, `excerpt` (per locale) |
| FAQ | `slug` only | `published` toggle, `category`; translation fields: `question`, `answer` (per locale) |
| Features | `slug` + `order` | `published` toggle, `icon`; translation fields: `title`, `description` (per locale) |
| Pricing | `name`, `slug`, `price`, `featured`, `order` | `currency`, `billingPeriod`, `discountPercent`; translation fields: `title`, `description` (per locale); pricing features sub-entity |
| Portfolios | Full form (name, type, slug, description, published) | Portfolio items sub-resource has API but no admin UI page |

### CRITICAL FINDING: FormField atom exists but is unused

`src/lib/components/atoms/FormField.svelte` (112 lines) exists with support for
`text`, `email`, `password`, `tel`, `url`, `number`, `textarea`, `checkbox`
types plus error display. **None of the 10 create/edit admin form pages use it.**
Every form page hand-rolls raw `<input>`, `<label>`, and error display markup.

### CRITICAL FINDING: No PageHeader on create/edit pages

All system pages and the portfolios list page use `PageHeader`. All create/edit
form pages (blog, faq, features, pricing, portfolio) use an inline breadcrumb
bar (`<div class="flex items-center gap-4 py-4 mb-6 border-b...">`) with a
manual `<h1>` instead. This is a visual inconsistency.

### Form page audit

| Route | Config Status | Uses PageHeader? | Uses FormField? | Field Coverage | Notes |
|-------|--------------|------------------|-----------------|----------------|-------|
| Blog create | ❌ Disabled | No — inline breadcrumb | No — raw `<input>` | `slug` only (of 10+ possible fields) | SvelteKit form action + Zod + CSRF ✅ |
| Blog edit | ❌ Disabled | No | No | Same as create | Pre-filled from DB ✅ |
| FAQ create | ✅ Enabled | No — inline breadcrumb | No — raw `<input>` | `slug` only (of 5+ possible fields) | Form action + Zod + CSRF ✅ |
| FAQ edit | ✅ Enabled | No | No | Same as create | Pre-filled from DB ✅ |
| Features create | ✅ Enabled | No — inline breadcrumb | No — raw `<input>` | `slug` + `order` (of 6+ possible fields) | Form action + Zod + CSRF ✅ |
| Features edit | ✅ Enabled | No | No | Same as create | Pre-filled from DB ✅ |
| Pricing create | ❌ Disabled | No — inline breadcrumb | No — raw `<input>` | `name`/`slug`/`price`/`featured`/`order` (of 10+ possible fields) | Closest to complete field set |
| Pricing edit | ❌ Disabled | No | No | Same as create | Pre-filled from DB ✅ |
| Portfolio create | ✅ Enabled | No — inline breadcrumb | No — raw inputs | `name`/`type`/`slug`/`description`/`published` | Good coverage ✅ |
| Portfolio edit | ✅ Enabled | No | No | Same as create | Pre-filled from DB ✅ |

---



---

## Code Quality & Component Extraction Audit

The admin panel violates PM3 framework rules about component composition.
Pages are monolithic (291–446 lines) with extensive duplicated markup.
Existing framework components (`FormField`, `AdminTabs`, `EmptyState`) are unused.

### Page file sizes (lines)

| File | Lines | Expected | Status |
|------|-------|----------|--------|
| `admin/translations/+page.svelte` | 446 | ~200 | 🔴 2.2× target |
| `admin/legal/+page.svelte` | 387 | ~200 | 🔴 1.9× target |
| `admin/settings/+page.svelte` | 296 | ~200 | 🟡 1.5× target |
| `admin/+layout.svelte` | 291 | ~150 | 🔴 1.9× target |
| `admin/users/+page.svelte` | 282 | ~200 | 🟡 1.4× target |
| `admin/login/+page.svelte` | 240 | ~200 | 🟢 Near target |
| `admin/blog/+page.svelte` | 40 | — | ✅ Properly delegated |
| `admin/faq/+page.svelte` | 38 | — | ✅ Properly delegated |

### Duplicated patterns (framework rule violations)

| Pattern | Occurrences | Duplicated Lines | Fix |
|---------|-------------|-----------------|-----|
| **Admin Modal** (overlay + card + header + form + footer) | 2 (translations:358, users:215) | ~150 lines | Extract `AdminModal` molecule |
| **Form Section Card** (section wrapper with header + body) | 3× in legal + N× in settings | ~40 lines per occurrence | Extract `AdminFormSection` molecule |
| **Raw `<input>` + `<label>`** | ~15× across legal, users, settings | ~10 lines each | Use existing `FormField` atom |
| **Locale Tabs** | 2 (translations:263, legal:305) | ~35 lines | Use existing `AdminTabs` molecule |
| **Contact Picker toggle grid** | 2 in same file (settings:237, settings:264) | ~20 lines | Extract `ContactPicker` molecule |
| **User Menu dropdown** | 3 in layout (vertical, horizontal, mobile) | ~30 lines | Extract `UserMenu` molecule |
| **Save button footer** | 2 (legal, settings) | ~8 lines | Extract `FormFooter` molecule |
| **Empty state message** | 1 (translations hand-rolls `<p class="py-16...">`) | ~2 lines | Use existing `EmptyState` atom |

### Existing components that are UNUSED in admin pages

| Component | Location | Used By |
|-----------|----------|---------|
| `FormField` | `src/lib/components/atoms/FormField.svelte` (112 lines) | **No admin page** — supports text, email, password, tel, url, number, textarea, checkbox + error display |
| `AdminTabs` | `src/lib/components/admin/AdminTabs.svelte` (60 lines) | **Not used** — translations and legal hand-roll their own tab bars |
| `EmptyState` | `src/lib/components/atoms/EmptyState.svelte` | **Not used in translations** — hand-rolled `<p>` instead |

### Missing molecules that PM2 had as separate components

| Component | PM2 Equivalent | Needed By |
|-----------|---------------|-----------|
| `AdminModal` | modal dialog in admin.vue | translations, users, (future: all CRUD modals) |
| `AdminFormSection` | section cards in admin-settings.css | legal, settings, (future: all form pages) |
| `AppBottomNav` | `AppBottomNav.vue` (255 lines CSS) | admin layout (mobile APP MODE) |
| `AppMobileHeader` | admin-header.css (592 lines) | admin layout (mobile APP MODE) |
| `ContactPicker` | contact-picker in admin-settings.css | settings |
| `UserMenu` | user dropdown in admin-header.css | admin layout |
| `MarkdownEditor` | textarea + preview toggle | legal |

### Recommended extraction priority

1. **`AdminModal`** (molecule) — eliminates ~150 duplicated lines immediately across 2 files
2. **`AdminFormSection`** (molecule) — eliminates ~120 duplicated lines across legal + settings
3. **`AppBottomNav`** (molecule) — enables proper APP MODE mobile navigation (was 255 lines in PM2)
4. **`AppMobileHeader`** (molecule) — enables proper APP MODE mobile header (was 592 lines in PM2)
5. **Migrate pages to `FormField`** — eliminates ~150 lines of raw input markup
6. **Migrate pages to `AdminTabs`** — eliminates ~35 duplicated lines
7. **`ContactPicker`** (molecule) — deduplicates toggle grids in settings
8. **`UserMenu`** (molecule) — deduplicates 3 user menu variants in layout
9. **`MarkdownEditor`** (molecule) — deduplicates textarea+preview pattern in legal

## Non-visual contracts that the rewrite must preserve

These behaviors are enforced by server code and remain correct:

### Menu visibility — `src/lib/server/utils/admin-pages.ts`
- `ADMIN_PAGE_DEFS` is the single source of truth for every admin page.
- `getAuthorizedAdminPages(user)` (line 135 of `admin-rbac.ts`) resolves menu
  visibility from `ADMIN_CONFIG` + `MODULES` + stored role permissions.

### Page access — `src/lib/server/utils/admin-rbac.ts`
- `requireAdminPage(event, pageId)` (line 114) gates every admin route:
  1. authentication required (401)
  2. page enabled in config (404)
  3. user's role in the page's configured role list (403)
  4. stored role permissions (`roles.permissions` JSON) must not deny (403)

### Page enablement — `src/project/site-config.ts`
- `ADMIN_CONFIG.system[pageId].enabled` / `ADMIN_CONFIG.websiteModules[key].enabled`
  control whether a page exists. Disabled → 404 + hidden from menu.
- `MODULES[key].enabled` controls website-content modules independently from admin.

### Layout contracts
- Forced password change (`mustChangePassword`) redirect from layout server
- CSRF token in layout data for plain form submissions
- Unread contact count with 10-second TTL

### Authorization verification table

| Role | Menu visibility | Route access | Mutation access (system keys) |
|---|---|---|---|
| master | All enabled pages | All enabled pages | Allowed (system + content) |
| admin | All enabled pages | All enabled pages | Allowed (system + content) |
| editor | Content-module pages (faq, features); dashboard; translations (content only toggle) | Content-module pages + dashboard + translations | Content keys only; system keys rejected (403) |
| Disabled modules | Page hidden from menu | 404 from `requireAdminPage` | N/A |
| `mustChangePassword=1` | Menu hidden (redirected) | Redirect to `/admin/change-password` | Mutations blocked |

---

## Server-side system-translation authorization — ✅ IMPLEMENTED

`isSystemKey(key)` classifies by prefix (`admin.`, `nav.`, `common.`, `auth.`,
`validation.`, `footer.`, `error.`, `apiErrors.`). Every translation mutation
endpoint enforces: system keys → 403 unless master/admin. UI lock icons are
a convenience layer — the real security boundary is the API guard.

---

## Full admin surface inventory (corrected)

### System pages

| Route | Status | Notes |
|---|---|---|
| Dashboard | ✅ Complete | 4 stat cards |
| Users | ✅ Complete | Full CRUD with modals |
| Roles | ⚠️ Read-only | Table display only — no CRUD UI |
| Translations | ✅ Complete | Full feature set |
| Settings | ✅ Complete | Bulk save + pickers |
| Legal | ✅ Complete | Combined page |
| Audit | ✅ Complete | `AdminDataTable` |
| Health | ✅ Complete | `AdminDataTable` (tuple data, fragile) |
| Security | ✅ Complete | Password change + 2FA |

### Website module list pages

| Route | Status | Config | Gaps |
|---|---|---|---|
| Portfolios | ✅ Complete | Enabled | None — gold standard |
| FAQ | ⚠️ No actions | Enabled | No Create/Edit/Delete UI; raw cards, no data table |
| Features | ⚠️ No actions | Enabled | No Create/Edit/Delete UI; raw cards, no data table |
| Blog | 🔴 Dead code | Disabled | Minimal card list; config must be enabled; missing all fields |
| Pricing | 🔴 Dead code | Disabled | Card grid; config must be enabled; missing actions |
| Team | ✅ Read-only (by design) | Disabled | Seeded entity |
| Testimonials | ✅ Read-only (by design) | Disabled | Seeded entity |
| Clients | ✅ Read-only (by design) | Disabled | Seeded entity |
| Contacts | 🔴 Dead code | Disabled (module) | AdminDataTable but no actions; config must be enabled |

### Website module create/edit pages

| Route | Status | Config | Gaps |
|---|---|---|---|
| Blog create/edit | 🔴 Dead code | Disabled | Minimal fields (slug only); no PageHeader; no FormField |
| FAQ create/edit | ⚠️ Functional but minimal | Enabled | Minimal fields (slug only); no PageHeader; no FormField |
| Features create/edit | ⚠️ Functional but minimal | Enabled | Slug + order only; no PageHeader; no FormField |
| Pricing create/edit | 🔴 Dead code | Disabled | Best field coverage but still incomplete; no PageHeader; no FormField |
| Portfolio create/edit | ⚠️ Functional | Enabled | Good field coverage; no PageHeader; no FormField |

---

## Gaps NOT in the original plan (new findings)

### G1: No admin file upload UI
Blog cover images, portfolio item images, client logos — there is no file upload
component in the admin panel. The `blog_media` table exists, `portfolio_items`
supports images, but no admin UI can upload files.

### G2: No pagination on page-level data loads
All `+page.server.ts` load functions use `.all()` without pagination. API
endpoints (`/api/admin/blog`, `/api/admin/users`) support `?page=&limit=`
pagination, but the page loads fetch everything. This will become a performance
issue as data grows.

### G3: Contacts inbox is read-only
`admin/contacts/+page.svelte` shows submissions in an `AdminDataTable` but has no
delete, mark-read, or reply actions. The `DELETE /api/admin/contacts/[id]` API
exists but is not wired to the UI. No `PATCH` endpoint for read status exists.

### G4: No portfolio items management UI
The API supports `GET/POST/PUT/DELETE /api/admin/portfolios/[id]/items/` but
there is no admin page for managing items (images, descriptions) within a
portfolio.

### G5: Roles page — no CRUD UI
`GET/POST/PUT/DELETE /api/admin/roles/[id]` endpoints all exist and work. The
page shows a read-only table with no Create/Edit/Delete buttons.

### G6: Admin translations depend on DB seed
All admin UI strings come from the DB `translations` table via
`getAdminTranslations()`. If the table is empty for a particular locale, admin
pages show raw i18n keys (e.g., `"admin.blog"` instead of "Blog"). There is no
fallback to Paraglide static messages for admin keys.

### G7: No RTL layout support in admin
4 locales exist (ru, en, fr, he). `isRtlLocale()` helper exists in
`src/lib/config/site.ts` but the admin layout uses LTR-only classes. Hebrew
(`he`) admins would see a misaligned layout.

### G8: FormField atom exists but is unused
`src/lib/components/atoms/FormField.svelte` (112 lines) supports text, email,
password, tel, url, number, textarea, checkbox + error display + `twMerge` class
prop. **None of the 10 admin create/edit form pages use it.** Every form
hand-rolls `<input>`, `<label>`, and error markup.

### G9: Create/edit pages don't use PageHeader
All system pages use `PageHeader`. All 10 create/edit form pages use an inline
breadcrumb bar with a manual `<h1>`. Inconsistent with system pages.

### G10: Blog form captures only slug
The blog create form Zod schema validates `slug` only. The DB schema supports
`categoryId`, `coverImageUrl`, `published`, and the `blog_post_translations`
table supports `title`, `content`, `excerpt` in multiple locales. None of these
are exposed in the form.

### G11: FAQ/Features/Pricing forms similarly minimal
FAQ: `slug` only. Features: `slug` + `order`. Pricing: `name`/`slug`/`price`/`featured`/`order`.
None expose translation fields or related entities (pricing features, FAQ categories).

---

## Summary: what the previous plan got wrong

| Previous Claim | Reality |
|---|---|
| "All 9 phases ✅ Complete" | Phases 1–6, 8, 9 are complete. Phase 7 (CRUD pages) is severely incomplete. |
| "Blog — Card list with cover image, title, categories, tags, locale indicators" | 40-line card list showing `slug` + published badge + empty placeholder. Config disabled. |
| "FAQ — List with question/answer/category" | 38-line card list showing `slug` + `order` + published badge. No actions. |
| "Features — Grid with title/description/icon" | 35-line card grid showing `slug` + `order` + published badge. No actions. |
| "Blog, Pricing listed as active admin pages" | Both `enabled: false` in `ADMIN_CONFIG.websiteModules` — return 404. |
| "Contacts listed as active" | `MODULES.contact.enabled = false` — module gate overrides ADMIN_CONFIG. |
| "Create pages use PageHeader + FormField" | No create page uses PageHeader or FormField. All use inline breadcrumb + raw `<input>`. |
| "FormField canonical atom is future work" | FormField already exists at `src/lib/components/atoms/FormField.svelte` — it's just unused. |

---

## Corrected implementation phases

### ✅ Completed phases

1. **Phase 1**: AdminDataTable visual parity
2. **Phase 2**: PageHeader visual parity
3. **Phase 3**: Translations page (namespace groups, section toggle, modal, server-side guard)
4. **Phase 4**: Settings page (bulk save, contact picker)
5. **Phase 5**: Legal page (combined settings + docs)
6. **Phase 6**: Users page (role badges, modal)
7. **Phase 8**: Admin layout content area
8. **Phase 9**: Mobile bottom nav

### 🔴 Incomplete — Phase 7: CRUD page normalization

Phase 7 was marked complete but is NOT. The remaining work (depends on Phase 11 — `AdminModal` must be extracted first):

| Task | Current State | Target State |
|------|--------------|--------------|
| FAQ list page | Raw card list, no actions | `PageHeader` + Create CTA + `AdminDataTable` + edit/delete actions (model after portfolios page) |
| Features list page | Raw card grid, no actions | Same as FAQ |
| Blog list page | Minimal cards, config disabled | Enable config + proper card list with cover/title/categories/tags/locale badges + actions |
| Pricing list page | Card grid, config disabled | Enable config + proper card list with actions |
| Contacts page | Table, config disabled | Enable config + add delete action buttons |
| Roles page | Read-only table | Add create/edit/delete UI (modals or form pages) |

### 🔴 Incomplete — Phase 10: Form normalization

| Task | Current State | Target State |
|------|--------------|--------------|
| Migrate all create/edit forms to `FormField` atom | Raw `<input>` in 10 pages | `<FormField>` component usage in all admin forms |
| Migrate all create/edit forms to `PageHeader` | Inline breadcrumb + `<h1>` in 10 pages | `PageHeader` with back-link in actions snippet |
| Expand blog create/edit form | `slug` only | Add `title`, `content`, `excerpt` (per-locale), `categoryId`, `coverImageUrl`, `published` |
| Expand FAQ create/edit form | `slug` only | Add `question`, `answer` (per-locale), `published`, `category` |
| Expand Features create/edit form | `slug` + `order` | Add `title`, `description` (per-locale), `published`, `icon` |
| Expand Pricing create/edit form | Basic fields | Add translation fields, billing period, currency, pricing features |

### 🔴 Missing — Phase 11: Component extraction (code quality)

| Task | Priority | Description |
|------|----------|-------------|
| Extract `AdminModal` molecule | 🔴 P0 | Modal shell (overlay + card + header + form slot + footer) — used by translations, users, all future CRUD |
| Extract `AdminFormSection` molecule | 🔴 P0 | Section wrapper (border card + header + body slot) — used by legal, settings, all form pages |
| Extract `AppBottomNav` molecule | 🔴 P0 | APP MODE bottom navigation — scrollable category rows, all items accessible, icons + labels |
| Extract `AppMobileHeader` molecule | 🔴 P0 | APP MODE mobile header — full user dropdown, page title, theme/language toggles |
| Migrate to `FormField` atom | 🟡 P1 | Replace ~150 lines of raw input markup in legal, settings, users |
| Migrate to `AdminTabs` molecule | 🟡 P1 | Replace hand-rolled tabs in translations (263) and legal (305) |
| Extract `ContactPicker` molecule | 🟡 P1 | Deduplicate toggle grids in settings |
| Extract `UserMenu` molecule | 🟡 P1 | Deduplicate 3 user menu variants in layout |
| Extract `MarkdownEditor` molecule | 🟢 P2 | Deduplicate textarea+preview in legal |

### 🔴 Missing — Phase 12: Gaps from audit

| Gap | Description |
|-----|-------------|
| G1: File upload | Build file upload UI component for blog covers, portfolio images, client logos |
| G2: Pagination | Add pagination to page-level `+page.server.ts` loads |
| G3: Contacts actions | Add delete + mark-read UI to contacts inbox |
| G4: Portfolio items UI | Build portfolio items management page within portfolio edit |
| G5: Roles CRUD | Add create/edit/delete UI to roles page |
| G6: Translation fallback | Add Paraglide static fallback for admin i18n keys when DB translations are missing |
| G7: RTL admin layout | Apply `isRtlLocale()` direction classes to admin layout |
| G8: Health page types | Replace `[string, string][]` tuples with typed objects |

## Implementation order (recommended)

### Foundation: Component extraction (must come first)

1. **Phase 11: Core molecules** — `AdminModal`, `AdminFormSection`, `AppBottomNav`, `AppMobileHeader`
   These are prerequisites for everything below — pages can't use them until they exist.

### Configuration

2. **Config decisions** — enable blog/pricing/contacts if they should be live

### Feature work

3. **Phase 7 completion** — FAQ, Features list pages with proper actions (using `AdminDataTable` + `AdminModal`)
4. **Phase 10: Form migration** — Migrate forms to `FormField` + `PageHeader` + expanded fields (using `AdminFormSection`)
5. **Phase 8+9: Mobile APP MODE layout** — Proper `AppBottomNav` + `AppMobileHeader` + tablet rail (requires extracted components)

### Polish

6. **Phase 11 remaining** — `ContactPicker`, `UserMenu`, `AdminTabs` migration, `MarkdownEditor`
7. **Phase 12: Audit gaps** — File upload, pagination, contacts actions, portfolio items UI, roles CRUD, translation fallback, RTL, health types
