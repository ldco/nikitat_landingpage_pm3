# Puppet Master Framework Boundary Map

Status: planning guardrail
Date: 2026-05-01

This map prevents the migration from turning into hard fragmentation. A file should not move to a new package only because it looks reusable. It moves only when its owner is clear and the destination boundary is stable.

## Ownership Buckets

### Core

Stable PM runtime used by every PM project mode.

Core includes:

- Project config loading and derived config helpers
- Shared type contracts and module registry contracts
- API transport primitives such as CSRF and fetch wrappers
- Auth/session/RBAC/audit primitives
- Validation and request utility primitives
- Setup/init guards and framework health primitives
- Base CSS tokens and framework-level style contracts
- Framework scripts, tests, and docs that validate PM itself

Core must not include:

- Project-specific content (branding, copy, sections, assets)
- Plugin feature behavior such as blog/pricing/contact content flows
- Admin UI screens as a product surface
- One-off deployment configuration for a single project

### Site Shell

The public website shell for `site-only` and `site + admin` projects.

Site shell includes:

- Public layouts and website chrome
- Header/footer/navigation behavior
- Generic public route rendering
- Website-only interaction helpers such as scroll header and scroll spy

Site shell must not include:

- Feature modules such as blog/pricing/contact
- Project copy, branding, or content
- Admin management screens

### Admin Shell

The PM management interface. This exists for `site + admin` and can also be the primary UI in `APP` mode.

Admin shell includes:

- Admin layout and navigation
- Admin pages and management screens
- Admin API surface for PM-managed resources
- Admin operational views, settings, users, roles, audit, health

Admin shell must not include:

- Public website rendering
- Project-specific dashboard behavior that is not PM management
- Plugin internals unless they are explicit plugin-admin surfaces

### App Shell

The authenticated product/dashboard shell for `APP` mode projects where the app is the product itself.

App shell includes:

- Authenticated app layout
- App navigation patterns
- Product/dashboard shell primitives
- App-mode route guards and app-mode UX contracts
- App entry contract via projected PM config (`appShell.entryPath`)

App shell must not include:

- PM admin management screens unless the project intentionally uses admin as the app surface
- Public site chrome
- Plugin feature internals

Current routing rule:

- App-only projects redirect non-app routes to `appShell.entryPath`.
- `/admin/*` is available only when `admin.enabled` is true.
- App-only without admin is supported as an app-shell route contract, not by silently routing through admin-shell login.

### Plugins

Optional feature packages. A plugin can have public UI, admin UI, server APIs, schema, seed data, docs, and tests.

Current plugin buckets:

- `plugin-blog`
- `plugin-pricing`
- `plugin-contact`
- `plugin-scrollytelling`
- `plugin-portfolio`
- `plugin-faq`
- `plugin-team`
- `plugin-testimonials`
- `plugin-clients`
- `plugin-features`
- `plugin-media`
- `plugin-analytics`

Plugins must not include:

- Global framework config loading
- Auth/session primitives
- Project-specific content
- Shell routing that should work without the plugin

### Project

The current product/client layer.

Project includes:

- `project/puppet-master.config.ts`
- Project-specific branding, content, custom sections, custom assets
- Project-only pages, APIs, deployment values, and data
- Project-specific generated output that should not ship with PM

### Undecided

Temporary classification for files that need inspection before moving.

Rules:

- Undecided paths are not moved.
- Undecided paths can be narrowed into core/shell/plugin/project after reading their imports, callers, tests, and runtime role.
- A path should not remain undecided once it is touched for migration.

## Current Broad Map

| Path | Owner | Status | Notes |
| --- | --- | --- | --- |
| `pm-core/app/types/**` | core | conflict/coupled | Shared type contracts already moved. `modules.ts` still contains plugin route/admin metadata and needs a later split before plugin metadata is considered core-stable. |
| `pm-core/app/composables/usePmConfig.ts` | core | canonical | Core config reader. |
| `pm-core/app/composables/useConfig.ts` | core | canonical | Public config wrapper. |
| `pm-core/app/composables/useSafeConfig.ts` | core | canonical | SSR-safe config wrapper. |
| `pm-core/app/composables/useModule.ts` | core | conflict/coupled | Module config access is core, but it currently exposes route/admin metadata from `modules.ts`. Do not use it as a signal to move plugin route/admin metadata. |
| `project/puppet-master.config.ts` | project | canonical | Current project config. |
| `app/composables/apiFetch.ts` | core | candidate | Move with `useCsrf`; transport primitive. |
| `app/composables/useCsrf.ts` | core | candidate | Move with `apiFetch`; security primitive. |
| `app/composables/useAuth.ts` | core | candidate | Core auth state, but review app/admin coupling first. |
| `app/composables/useConfirm.ts` | core | candidate | Shared UI primitive, move only with dialog ownership plan. |
| `app/composables/useToast.ts` | core | candidate | Shared UI primitive, move only with toast container ownership plan. |
| `app/composables/useFormDirty.ts` | core | candidate | Generic framework form helper. |
| `app/composables/usePagination.ts` | core | candidate | Generic framework helper. |
| `app/composables/useMediaQuery.ts` | core | candidate | Generic client helper. |
| `app/composables/useClientMounted.ts` | core | candidate | SSR/hydration primitive. |
| `app/composables/useSiteSettings.ts` | core | candidate | Runtime settings access; review settings API coupling first. |
| `app/composables/useHeaderQuickContacts.ts` | undecided | coupled | Crosses site-shell, settings, project branding, and icon dependencies. Not safe for physical move yet. |
| `app/composables/useLogo.ts` | undecided | coupled | Crosses site-shell and project logo asset conventions. Not safe for physical move yet. |
| `app/composables/useWebsiteNavigation.ts` | site-shell | candidate | Public navigation behavior. |
| `app/composables/useScrollHeader.ts` | site-shell | candidate | Website chrome interaction. |
| `app/composables/useScrollSpy.ts` | site-shell | candidate | Onepager navigation behavior. |
| `app/composables/useReveal.ts` | site-shell | candidate | Public visual behavior; can become core only if used across shells. |
| `app/composables/useScrollytelling.ts` | plugin-scrollytelling | candidate | Story runtime behavior. |
| `app/composables/useLegalDocuments.ts` | plugin-contact | candidate | Current legal/contact/public footer coupling; review before moving. |
| `app/composables/useUnreadCount.ts` | admin-shell | candidate | Admin stats badge behavior. |
| `app/composables/useWebSocket.ts` | app-shell | candidate | Runtime app/admin realtime helper; inspect consumers before moving. |
| `app/composables/useCookieConsent.ts` | site-shell | candidate | Public website privacy behavior. |
| `app/assets/css/colors/**` | core | candidate | Framework color primitives/tokens. |
| `app/assets/css/typography/**` | core | candidate | Framework typography primitives/tokens. |
| `app/assets/css/common/**` | core | candidate | Shared utilities; inspect project-specific classes first. |
| `app/assets/css/layout/**` | mixed | undecided | Split core layout, site shell, admin shell. |
| `app/assets/css/skeleton/**` | site-shell | candidate | Header/nav/footer shell styling. |
| `app/assets/css/ui/admin/**` | admin-shell | candidate | Admin UI styling. |
| `app/assets/css/runtime/**` | mixed | undecided | Many files are plugin/section specific. |
| `app/components/atoms/**` | mixed | undecided | Some core primitives, some project/shell. |
| `app/components/molecules/**` | mixed | undecided | Shell/plugin/project mix. |
| `app/components/organisms/**` | mixed | undecided | Shell/plugin/admin mix. |
| `app/components/sections/**` | mixed | undecided | Mostly plugins/project sections. |
| `app/layouts/default.vue` | site-shell | candidate | Public site layout. |
| `app/layouts/admin.vue` | admin-shell | candidate | Admin layout. |
| `app/layouts/blank.vue` | core | candidate | Shared layout primitive if generic. |
| `app/pages/admin/**` | admin-shell | candidate | Admin UI surface. |
| `app/pages/legal/**` | plugin-contact | candidate | Public legal documents; review ownership. |
| `app/pages/[section].vue` | site-shell | candidate | Public section routing. |
| `app/pages/index.vue` | site-shell | candidate | Public homepage renderer; project content stays config/data. |
| `app/middleware/**` | mixed | undecided | Split mode guards, auth guards, setup guards. |
| `app/plugins/**` | mixed | undecided | Split startup preferences, reveal, performance, client behavior. |
| `app/lib/assembly-engine/**` | plugin-scrollytelling | candidate | Story assembly runtime. |
| `server/utils/auth.ts` | core | candidate | Auth primitive. |
| `server/utils/admin-rbac.ts` | core | candidate | RBAC primitive. |
| `server/utils/audit.ts` | core | candidate | Audit primitive. |
| `server/utils/validation.ts` | core | candidate | Shared validation contracts; review plugin schemas. |
| `server/utils/setup-guard.ts` | core | candidate | Setup/init primitive. |
| `server/utils/storage/**` | core | candidate | Storage abstraction; media plugin may consume it. |
| `server/api/auth/**` | core | candidate | Auth API surface. |
| `server/api/setup/**` | core | candidate | Setup wizard API surface. |
| `server/api/health.get.ts` | core | candidate | Framework health endpoint. |
| `server/api/docs/**` | core | candidate | Framework API docs unless plugin-generated. |
| `server/api/admin/**` | admin-shell | candidate | Admin management API surface. |
| `server/api/blog/**` | plugin-blog | candidate | Public blog API. |
| `server/api/admin/blog/**` | plugin-blog | candidate | Blog admin API. |
| `server/api/pricing/**` | plugin-pricing | candidate | Public pricing API. |
| `server/api/admin/pricing/**` | plugin-pricing | candidate | Pricing admin API. |
| `server/api/contact/**` | plugin-contact | candidate | Contact API. |
| `server/api/admin/contacts/**` | plugin-contact | candidate | Contact admin API. |
| `server/api/portfolios/**` | plugin-portfolio | candidate | Portfolio API. |
| `server/api/faq/**` | plugin-faq | candidate | FAQ API. |
| `server/api/admin/faq/**` | plugin-faq | candidate | FAQ admin API. |
| `server/api/team/**` | plugin-team | candidate | Team API. |
| `server/api/admin/team/**` | plugin-team | candidate | Team admin API. |
| `server/api/testimonials/**` | plugin-testimonials | candidate | Testimonials API. |
| `server/api/admin/testimonials/**` | plugin-testimonials | candidate | Testimonials admin API. |
| `server/api/clients/**` | plugin-clients | candidate | Clients API. |
| `server/api/admin/clients/**` | plugin-clients | candidate | Clients admin API. |
| `server/api/features/**` | plugin-features | candidate | Features API. |
| `server/api/admin/features/**` | plugin-features | candidate | Features admin API. |
| `server/api/upload/**` | plugin-media | candidate | Media upload API; review storage/auth boundary. |
| `server/api/media/**` | plugin-media | candidate | Media serving/proxy API. |
| `server/api/analytics/**` | plugin-analytics | candidate | Analytics collection API. |
| `server/database/schema.ts` | mixed | undecided | Split core tables, shell tables, plugin tables later. |
| `server/database/seed.ts` | mixed | undecided | Split framework seed vs project seed. |
| `server/repositories/**` | mixed | undecided | Classify by table/domain. |
| `scripts/**` | mixed | undecided | Classify framework tooling vs project/deploy tooling per script. |
| `tests/server/utils/**` | core | candidate | Tests follow source owner. |
| `tests/server/database/**` | mixed | undecided | Tests follow schema ownership. |
| `tests/components/**` | mixed | undecided | Tests follow component ownership. |
| `tests/e2e/**` | mixed | undecided | Shell/plugin/project flow tests. |
| `docs/core_migration/**` | core | canonical | Framework migration docs. |
| `docs/reference/**` | mixed | undecided | Some framework reference, some project launch docs. |
| `docs/operations/**` | mixed | undecided | Framework ops vs project deployment. |
| `docs/releases/**` | core | candidate | Framework release notes unless project-only. |

## Migration Rules

1. Do not create a new package for every folder. Start with documented ownership, then move only stable slices.
2. No compatibility aliases or old import wrappers.
3. A move must update every caller in the same commit.
4. A move must add or update ownership manifest entries.
5. A move must pass `npm run check:pm-ownership`, targeted tests, and `npm run build` when Nuxt resolution can be affected.
6. Server routes move later than client composables because Nitro routing and API contracts have higher blast radius.
7. Plugin APIs, plugin admin pages, plugin public components, plugin tests, and plugin docs move together only after the plugin boundary is designed.

## Recommended Next Slices

1. Core API transport:
   - `app/composables/useCsrf.ts`
   - `app/composables/apiFetch.ts`

2. Core client primitives:
   - `app/composables/useClientMounted.ts`
   - `app/composables/useMediaQuery.ts`
   - `app/composables/usePagination.ts`
   - `app/composables/useFormDirty.ts`

3. Site shell boundary:
   - website navigation/logo/header composables
   - `app/layouts/default.vue`

4. Server core boundary:
   - auth/RBAC/audit/setup utilities
   - auth/setup/health APIs

5. Admin shell and plugins:
   - classify and move one plugin at a time, not by entire `server/api`.

## Explicit Non-Moves For Now

- Do not move `app/composables/useLogo.ts` yet.
- Do not move `app/composables/useHeaderQuickContacts.ts` yet.
- Do not split `pm-core/app/types/modules.ts` yet.
- Do not treat plugin `routes` and `adminSections` metadata in `MODULE_REGISTRY` as pure PM core. A later slice should separate pure module type/default-config contracts from shell/plugin route metadata.
