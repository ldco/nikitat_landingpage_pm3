# Brownfield Migration Entrypoint

Owner: PM Core Team  
Last updated: 2026-05-05

## When to use this doc

Use this document when moving an existing product into Puppet Master or upgrading an existing Puppet Master project across releases.

This is the correct path when the source product already has routes, user flows, data, assets, SEO value, integrations, or operational behavior that must be preserved. Brownfield work is a mapping and migration exercise, not a clean rebuild.

If the only input is a brief, mockup, or blank idea with no existing code/data contract, use [Greenfield Build](./greenfield-build.md).

## Source of truth

The target must be the latest accepted Puppet Master repository state, not an old client copy:

1. Pull the official PM repository/release.
2. Keep the committed `package-lock.json` and `framework.versions.json`.
3. Read `docs/releases/README.md` and every release note between the source and target version.
4. Create a migration branch.
5. Keep the imported project in `import/` or another clearly isolated folder until each piece is mapped.

The migration goal is to adopt PM contracts while preserving product behavior that still matters.

## First 30 minutes

1. Inventory current project contracts:
   - public routes
   - admin routes and roles
   - database schema/migrations
   - CSS utility usage
   - auth/session behavior
   - SEO metadata and redirects
   - assets, uploads, fonts, and icons
   - environment variables and integrations
2. Read current and target release docs in `docs/releases/`.
3. Create migration branch and run baseline checks:
   - `npm run lint`
   - `npm run test:run`
   - `npm run build`
4. Decompose the import into PM domains:
   - frontend
   - backend/API
   - database
   - styles
   - auth/RBAC
   - i18n/localization
   - assets/media
   - deployment/runtime
5. Map each item to a migration action:
   - `PM_EXISTS`: use PM's existing implementation
   - `PM_NATIVE`: replace with PM's native pattern
   - `CREATE`: build new PM-native code
   - `REWRITE`: port logic into PM conventions
   - `PROXY`: keep external service and connect through PM
   - `KEEP`: keep original system temporarily
   - `COPY`: copy static assets/data as-is
   - `CONVERT`: transform into PM CSS/content/schema format
   - `MERGE`: combine with an existing PM component or module
   - `SKIP`: intentionally drop as obsolete
6. Apply required release upgrade actions in order.
7. Re-run checks and capture any contract deltas.

## Do not break these rules

1. Never skip release-by-release upgrade actions.
2. Keep API response envelope/auth checks consistent on touched endpoints.
3. Do not introduce scoped styles while migrating legacy UI.
4. Keep sanitization rules on all `v-html` render paths.
5. Record local adoption status in release sync docs before deployment.
6. Do not copy legacy framework structure into PM if PM already provides the contract.
7. Keep imported project artifacts isolated until they are intentionally converted.
8. Preserve redirects and SEO-critical URLs unless the product owner approves a change.

## Required migration ledger

Create or update a migration ledger before implementation. It can live in `docs/migration/` for a project or in the relevant project planning document.

The ledger must record:

- source project name, stack, and version
- target PM version/release
- route mapping
- schema/table mapping
- API endpoint mapping
- component/style mapping
- auth/RBAC mapping
- asset and upload migration plan
- env var and secret mapping
- redirects and SEO changes
- accepted drops and behavior changes
- validation commands and results

## Cutover checklist

Before deployment:

1. All source routes are mapped to PM routes, redirects, or approved removals.
2. Data migration is repeatable and tested against a copy of production data.
3. Auth and admin roles are verified server-side.
4. Public forms, notifications, storage, and external APIs have smoke tests.
5. SEO metadata, canonical URLs, robots, sitemap, and social previews are reviewed.
6. Rollback path is documented.
7. `npm run lint`, `npm run test:run`, `npm run build`, and `npm run check:versions` pass.

## Read next

- `docs/releases/README.md`
- latest target release note in `docs/releases/`
- `docs/reference/api-reference.md`
- `docs/reference/configuration.md`
- `docs/reference/framework-versioning.md`
- `docs/architecture/overview.md`
