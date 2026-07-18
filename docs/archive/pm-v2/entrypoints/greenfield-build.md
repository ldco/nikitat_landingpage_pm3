# Greenfield Build Entrypoint

Owner: PM Core Team  
Last updated: 2026-05-15

## When to use this doc

Use this document when starting a brand-new site or app on Puppet Master with no legacy codebase to migrate.

This is the correct path for new client work, new internal products, and new experimental sites. The current repository is treated as the official Puppet Master reference version until a separate framework distribution exists, so new greenfield projects should start from a fresh copy of this repository and then remove or replace project-specific Fabrica22 content.

Greenfield does **not** mean "keep the last client project and edit until it looks close." A greenfield PM base is acceptable only when PM framework/runtime elements are intact and the project layer has no accidental Fabrica22 residue.

Do not use this path for an existing live product with routes, data, or UI that must be preserved. Use [Brownfield Migration](./brownfield-migration.md) instead.

## Source of truth

Start from the latest accepted Puppet Master repository state:

1. Pull or copy the official PM repository/release.
2. Keep the committed `package-lock.json` and `framework.versions.json`.
3. Create a new project branch or repository from that state.
4. Confirm `docs/releases/README.md` and the latest release note are current.

For now, copying the official PM app repository is the accepted greenfield bootstrap path because PM framework code and project code are not fully separated yet. Treat the copy as a framework baseline, then remove or replace client-specific content, seed data, assets, settings, and section wiring.

Avoid starting from an older client app copy unless it has first been updated to the current official PM baseline. Old client copies can carry stale dependencies, old release contracts, and project-specific assumptions into the new build.

## Clean PM Base Contract

Before project implementation starts, the copied repository must satisfy both sides of this contract:

1. PM framework core is preserved:
   - admin/auth/setup/legal routes still exist
   - shared atomic components still exist
   - global CSS layers and tokens still exist
   - system i18n and settings infrastructure still exists
   - Drizzle schema, migrations, scripts, Docker, deploy, and version files still exist
2. Project residue is removed or intentionally rewritten:
   - no Fabrica22 brand, copy, routes, section IDs, seed data, logos, favicon, social previews, or contact/legal settings remain in the active project layer
   - no Fabrica22-only section component remains registered in active section routing
   - no Fabrica22-only CSS file is imported by active components or runtime CSS
   - no old client module toggle remains enabled unless the new brief explicitly requires it

Historical references may remain only in archived contribution notes, release notes, or docs that intentionally describe the previous project. They must not affect runtime, seed data, public content, setup defaults, or generated assets.

## After Copy: Clean the Project Layer

The copied repository currently contains two things:

1. Puppet Master framework/runtime code that must stay.
2. The current Fabrica22 studio landing project layer that must be removed or replaced for the new project.

Until PM has a clean framework/package boundary, the greenfield job is not to delete everything and start over. The job is to keep PM's reusable contracts intact and replace only the project-specific layer.

### Keep PM framework code

Do not remove these unless you are intentionally changing the framework itself:

| Path | Keep because |
|---|---|
| `pm-core/` | PM framework composables, config access, and reusable runtime code |
| `server/utils/` | Auth, validation, audit, settings, storage, security, and shared server helpers |
| `server/database/schema.ts` | PM database contract and reusable module tables |
| `server/api/admin/` | PM admin API surface |
| `server/api/auth/` | PM authentication API surface |
| `app/pages/admin/` | PM admin UI routes |
| `app/pages/init.vue` | PM setup/init route |
| `app/pages/login.vue` | PM auth route |
| `app/pages/legal/[document].vue` | PM legal document rendering route |
| `app/components/atoms/`, `app/components/molecules/`, `app/components/organisms/` | Shared atomic component system |
| reusable `app/components/sections/Section*.vue` | PM section templates that can be reused by config |
| `app/composables/` | PM frontend runtime helpers |
| `app/assets/css/` | PM global CSS system and tokens |
| `i18n/system.ts`, `i18n/system-seed.json`, `i18n/loader.ts`, `i18n/i18n.config.ts` | PM system translations and i18n plumbing |
| `scripts/`, `ansible/`, `Dockerfile`, deploy files | PM build, dev, deploy, and operations tooling |
| `docs/reference/`, `docs/architecture/`, `docs/styles/`, `docs/releases/` | PM framework documentation |
| `framework.versions.json`, `package-lock.json`, `package.json` | Version and dependency contract |

### Replace project-specific layer

Replace or rewrite these before the copied repo becomes the new client project:

| Path | What to do |
|---|---|
| `README.md` | Replace Fabrica22 project description with the new project overview |
| `project/puppet-master.config.ts` | Replace brand, sections, features, modules, locales, footer/contact settings, and admin module toggles |
| `i18n/content.ts` | Replace Fabrica22 public copy with the new project's public content seed |
| `server/database/seed.ts` | Replace Fabrica22 settings, legal defaults, FAQ/content seed, and project default values |
| `public/logos/` | Replace project logo assets |
| `public/favicon.svg`, `public/og-image.*`, launch/social assets | Replace public launch, SEO, and social preview assets |
| custom Fabrica22-only sections such as `SectionHowWeOperate.vue` and `SectionProofOfFocus.vue` | Delete, rename, or rewrite for the new project's sections |
| Fabrica22-only CSS such as `section-fabrica22-story.css` | Delete or rewrite after no section imports it |
| `app/lib/assembly-engine/` | Keep only if the new project uses the same scrollytelling/story engine; otherwise remove after config no longer references it |
| `.env.example` project defaults | Keep infrastructure keys, replace project-specific examples |
| `docs/operations/*` project-specific notes | Keep reusable operations docs, rewrite client-specific deployment/contact notes |

### Greenfield forbidden states

Do not start feature work while any of these are true:

- `project/puppet-master.config.ts` still has old client section IDs, enabled modules, footer attribution, locales, contact defaults, or feature flags that the new brief did not request.
- `i18n/content.ts` or `server/database/seed.ts` still seeds old client public copy, FAQ entries, legal/company settings, SEO values, emails, Telegram settings, or contact defaults.
- active section routing still imports old client-only sections.
- active runtime CSS still imports old client-only CSS.
- public assets still show the old client brand unless they are documented placeholders and blocked from production launch.
- the local database was reused from the source project.

### Be careful with shared modules

Some files contain both PM defaults and current-project data. Edit them surgically:

- Keep contact submission infrastructure if the new project has contact forms.
- Keep FAQ/blog/portfolio/team/pricing modules if the new project needs those PM modules.
- Disable unused modules in `project/puppet-master.config.ts` before deleting their project-only sections or seeds.
- Do not remove admin pages only because the current public site does not use them. Admin modules are PM capability.
- Do not remove legal/settings/translation infrastructure. Replace its data.

### Cleanup order

1. Copy the official PM repo into the new project repository.
2. Create a cleanup branch before deleting anything.
3. Reset setup state for browser configuration:
   - keep `pmMode: 'unconfigured'` until `/init` writes the completed build config
   - do not force `pmMode: 'build'` before the wizard has saved project type, modules, locales, features, and workflow
4. Update `README.md` and `project/puppet-master.config.ts` for the new project shape.
5. Replace `i18n/content.ts` and project settings in `server/database/seed.ts`.
6. Replace logos, favicon, social preview, and launch assets.
7. Remove or rewrite Fabrica22-only sections and their CSS imports.
8. Run the active project residue audit and resolve every non-historical hit:
   - `rg -n "Fabrica22|fabrica22|fabrica|how-we-operate|proof-of-focus|hello@fabrica22|fabrica22\\.studio" README.md .env.example project i18n server app public docs/entrypoints QWEN.md CLAUDE.md`
9. Run the route/CSS wiring audit:
   - `rg -n "SectionHowWeOperate|SectionProofOfFocus|section-fabrica22-story|fabrica-story|fabrica-process|fabrica-proof" app`
10. Reset the local database and seed with project-appropriate data:
   - `npm run db:push`
   - `npm run db:seed`
11. Validate:
   - `npm run lint`
   - `npm run test:run`
   - `npm run build`
   - `npm run check:versions`

The residue audits are allowed to report this document and other explicit historical documentation. They should not report active runtime, config, seed, public asset, or active project docs after cleanup.

## First 30 minutes

1. Create a project brief before editing code:
   - audience and primary language
   - website, app, or website plus app
   - required public sections
   - required admin modules
   - integrations, forms, storage, notifications, and deployment target
2. Install dependencies:
   - `npm install`
3. Run initialization:
   - `npm run init`
   - choose build/client project mode
4. Decide runtime shape in `project/puppet-master.config.ts`:
   - `pmMode: 'unconfigured'` while the browser wizard is open
   - `pmMode: 'build'` only after `/init` successfully saves the completed build configuration
   - `entities.website`
   - `entities.app`
   - `admin.enabled`
   - locales and RTL support
5. Replace project-specific seed/content files:
   - `i18n/content.ts`
   - `server/database/seed.ts`
   - public assets and launch/social assets
6. Bootstrap the database:
   - `npm run db:push`
   - use `npm run db:seed` only after seed data has been made project-appropriate
7. Start local Docker runtime:
   - `npm run dev`
8. Validate baseline:
   - `npm run lint`
   - `npm run test:run`
   - `npm run build`
   - `npm run check:versions`
9. Re-run the project residue audits from the cleanup order before accepting the base.

## Do not break these rules

1. Keep config-driven behavior (avoid hardcoded nav/feature logic).
2. Keep role access aligned with config-driven admin sections.
3. Use global CSS classes and PM tokens only.
4. Replace Fabrica22-specific copy, assets, settings, and seed data before presenting the project as a client build.
5. Keep footer attribution default enabled unless there is an explicit opt-out requirement.
6. Document every framework-level pattern change in release notes.
7. Keep reusable framework improvements separate from project-only changes.
8. Empty module selection means all modules are disabled. Do not let old enabled modules survive because the new project currently needs none.
9. Browser setup must remain available until the wizard writes the final build config. Do not set `pmMode: 'build'` early and then expect `/init` to work.

## Minimum project checklist

Before implementation starts, capture:

- Project name and owner
- Target country/locales and date/currency formats
- Website/app/admin shape
- Public routes and onepager sections
- Admin roles and enabled modules
- Required database tables beyond PM defaults
- External APIs, storage, email, Telegram, analytics, and consent requirements
- Launch domain and deployment environment

## Recommended first tasks

1. Update `project/puppet-master.config.ts` for entities, modules, languages, branding, and feature flags.
2. Replace public content seeds and remove unused Fabrica22 sections.
3. Replace logos, favicon, social previews, and public media.
4. Configure settings schema and admin modules.
5. Add project-specific database schema only where PM defaults do not cover the need.
6. Build the public surface with existing PM section/component patterns.
7. Add focused tests around new server routes, custom modules, and critical forms.

## Read next

- `docs/guides/getting-started.md`
- `docs/reference/configuration.md`
- `docs/reference/security.md`
- `docs/reference/framework-versioning.md`
- `docs/releases/README.md`
