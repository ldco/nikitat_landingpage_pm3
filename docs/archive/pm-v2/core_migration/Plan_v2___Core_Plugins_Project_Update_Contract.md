# Plan v2: Core, Plugins, and Project Update Contract

## Purpose

This document proposes a stricter separation model for Puppet Master:

- PM core is a versioned platform.
- PM plugins are independently owned feature packages.
- Project code is a thin, protected overlay.

The goal is to let every project built on PM update to a newer PM version without losing project work or breaking client-specific code by accident.

## Core Problem

Today, framework functionality, reusable feature modules, and project-specific implementation can live in the same app tree. That makes upgrades risky because the system cannot reliably answer:

- Is this file owned by PM core?
- Is this file owned by a reusable PM plugin?
- Is this file project-specific?
- Was this PM-owned file modified by the project?
- Can this change be replaced during an upgrade?

The real architectural challenge is ownership, not file movement.

## Target Ownership Model

```txt
project-repo/
  package.json
  nuxt.config.ts
  app/
    project.config.ts
    content/
    components/project/
    assets/css/project.css
  server/
    api/project-only/
    database/project-schema.ts
  public/project-assets/

node_modules/
  @puppetmaster/core/
  @puppetmaster/plugin-blog/
  @puppetmaster/plugin-pricing/
  @puppetmaster/plugin-scrollytelling/
  @puppetmaster/plugin-contact/
```

The project consumes PM through versioned packages:

```ts
export default defineNuxtConfig({
  extends: [
    '@puppetmaster/core',
    '@puppetmaster/plugin-blog',
    '@puppetmaster/plugin-pricing',
    '@puppetmaster/plugin-scrollytelling'
  ],
  puppetMaster: {
    projectConfig: './app/project.config.ts'
  }
})
```

## Dependency Direction

The dependency graph must stay one-way:

```txt
project -> plugins -> core
core -x-> plugins
```

PM core must not know about blog, pricing, scrollytelling, portfolio, FAQ, team, or any other feature module. Core only knows how to load plugins, validate contracts, mount routes, expose admin extension points, run migrations, and enforce platform rules.

## PM Core Responsibilities

PM core owns:

- Config loader and validation foundation
- Plugin registry
- Admin shell
- Authentication and session primitives
- RBAC primitives
- Audit logging
- Security middleware
- Core API response conventions
- Database runtime and migration runner
- CSS primitives, semantic tokens, reset, base typography
- Atomic base components
- I18n foundation
- Setup/init workflow
- Upgrade and compatibility tooling

PM core does not own:

- Blog behavior
- Pricing behavior
- Scrollytelling scenes
- Portfolio behavior
- Client content
- Brand-specific assets
- Project-specific database tables
- Project-specific API routes

## Plugin Responsibilities

Each PM feature becomes a plugin with its own contract.

Examples:

- `@puppetmaster/plugin-blog`
- `@puppetmaster/plugin-pricing`
- `@puppetmaster/plugin-scrollytelling`
- `@puppetmaster/plugin-contact`
- `@puppetmaster/plugin-portfolio`
- `@puppetmaster/plugin-faq`
- `@puppetmaster/plugin-team`
- `@puppetmaster/plugin-testimonials`

Each plugin may own:

- Config schema
- Default config
- Components
- Sections
- Pages
- API routes
- Admin sections
- Database schema fragments
- Database migrations
- Seed/demo data
- Translations
- CSS component files
- Tests

Conceptual plugin shape:

```ts
export default definePuppetPlugin({
  name: 'blog',
  version: '2.1.0',
  requiresCore: '^2.0.0',

  configSchema,
  defaultConfig,

  components,
  sections,
  adminSections,

  database: {
    schema,
    migrations
  },

  apiRoutes,
  translations,
  css
})
```

## Project Responsibilities

Project code owns only client-specific implementation:

- Project config
- Content
- Branding
- Custom pages
- Custom sections
- Custom components
- Project-only API routes
- Project-only database tables
- Project-only seed data
- Project-level CSS overrides
- Media assets

Projects configure or override PM behavior. They should not edit PM core or plugin source files.

## Extension Points

Allowed project customizations:

```txt
Config override
CSS token override
CSS utility override
Component registry override
Named slot override
Section registry override
Admin extension registration
Project API route
Project database table
```

Disallowed customizations:

```txt
Editing PM core files
Editing PM plugin files
Copying a PM component just to tweak one detail
Monkey-patching plugin internals
Changing plugin database tables directly from project code
Relying on private imports
```

Example component override:

```ts
export default definePuppetProject({
  overrides: {
    components: {
      'blog.card': ProjectBlogCard,
      'pricing.tierCard': ProjectPricingCard
    }
  }
})
```

## Project Config Shape

Project config should declare intent, not implementation internals:

```ts
export default definePuppetProject({
  site: {
    name: 'ExampleProject',
    locales: ['en', 'ru'],
    defaultLocale: 'en'
  },

  plugins: {
    blog: {
      enabled: true,
      layout: 'grid'
    },
    pricing: {
      enabled: false
    },
    scrollytelling: {
      enabled: true,
      scenes: ['hero', 'process', 'proof']
    }
  }
})
```

## Versioning Rules

PM core and every plugin should use semantic versioning.

```txt
Patch: bug fix, no migration needed
Minor: new feature, backward compatible
Major: breaking config/API/schema change
```

Each package should provide:

- `CHANGELOG.md`
- `MIGRATIONS.md`
- Compatibility metadata
- Config migration scripts
- Database migrations
- Codemods when possible
- Deprecation warnings before removal

Compatibility example:

```txt
@puppetmaster/core@2.3 supports:
  @puppetmaster/plugin-blog: ^2.0
  @puppetmaster/plugin-pricing: ^2.1
  @puppetmaster/plugin-scrollytelling: ^1.5
```

## Upgrade Flow

Expected project update flow:

```bash
npm update @puppetmaster/core @puppetmaster/plugin-blog @puppetmaster/plugin-pricing
npx pm doctor
npx pm migrate --dry-run
npx pm migrate
npm run test
npm run build
```

The update tool should:

1. Read installed PM core and plugin versions.
2. Validate compatibility between core, plugins, and project config.
3. Detect project modifications to PM-owned files.
4. Run config migrations.
5. Run database migrations.
6. Run codemods where available.
7. Report manual actions.
8. Run validation commands.

## Ownership Manifest

PM needs a machine-readable ownership manifest.

Example:

```json
{
  "ownedBy": {
    "app/components/sections/SectionBlog.vue": "@puppetmaster/plugin-blog",
    "app/components/molecules/BlogPostCard.vue": "@puppetmaster/plugin-blog",
    "app/components/sections/SectionPricing.vue": "@puppetmaster/plugin-pricing",
    "server/utils/auth.ts": "@puppetmaster/core",
    "app/assets/css/colors/primitives.css": "@puppetmaster/core",
    "app/components/project/ProjectHero.vue": "project"
  }
}
```

This allows PM tooling to detect unsafe upgrade conditions.

Example conflict:

```txt
Conflict:
  app/components/sections/SectionBlog.vue
  Owned by @puppetmaster/plugin-blog
  Modified by project

Recommended:
  Move customization to app/components/project/BlogCard.vue
  Register override in project.config.ts
```

## Migration Path From Current PM

### Phase 1: Classify Ownership

Do not move files yet. First add ownership metadata for current files:

```txt
pm-core
pm-plugin-blog
pm-plugin-pricing
pm-plugin-contact
pm-plugin-scrollytelling
pm-plugin-portfolio
project
```

This gives the team upgrade visibility before a large refactor.

### Phase 2: Introduce Internal Plugin Registry

Keep files in place, but make features register through a plugin API instead of being hardcoded across config, admin, routes, and UI.

The first version can still be local and unpublished.

### Phase 3: Move Plugins Into Local Packages

Adopt a workspace layout:

```txt
packages/core
packages/plugin-blog
packages/plugin-pricing
packages/plugin-scrollytelling
packages/plugin-contact
apps/project-name
```

At this stage, the repo becomes structurally honest: framework, plugins, and project are physically separated.

### Phase 4: Publish or Install Versioned Packages

Projects consume PM packages by version. This can be done through:

- Private npm registry
- Git tags
- Tarball releases
- Workspace packages during active framework development

### Phase 5: Add Upgrade Tooling

Implement:

```bash
pm doctor
pm ownership
pm compatibility
pm migrate
pm codemod
```

These commands become the official project update path.

## Comparison With Layer-Only Migration

A Nuxt layer split such as `pm-core/` plus `project/` is a useful transitional step. It creates a clear core/project boundary without requiring package publishing immediately.

However, the layer-only model is weaker for reusable features because blog, pricing, scrollytelling, and similar modules remain bundled into the core boundary unless they are also split into plugins.

This plan treats the Nuxt layer split as an intermediate migration tactic, not the final architecture.

## Decision Recommendation

Use a staged approach:

1. Start with ownership classification.
2. Add a plugin registry while files remain mostly in place.
3. Move PM core into its own layer/package.
4. Move feature modules into plugins.
5. Protect project code with manifests and update tooling.

The most important rule is that every file must have exactly one owner:

```txt
core, plugin, or project
```

Once ownership is explicit, PM upgrades become a controlled compatibility problem instead of a risky code merge.
