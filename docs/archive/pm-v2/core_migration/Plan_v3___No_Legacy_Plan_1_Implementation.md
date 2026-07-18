# Plan v3: No-Legacy Plan 1 Implementation

## Goal

Start the Plan 1 migration now without compatibility shims.

The project will move toward a strict boundary:

```txt
pm-core/   framework-owned runtime, shells, built-in modules for now
project/   current product config, content, custom code, assets
```

No old-path compatibility aliases are allowed. When a file moves, all references must move in the same change.

## Non-Negotiable Rules

- No legacy aliases for old paths.
- No duplicated config files.
- No compatibility wrappers that keep old imports working.
- No partial move that leaves runtime code importing moved files from the old location.
- Each migrated phase must end with stale-path checks and a build/type validation attempt.

## Ownership Categories

Every file should eventually have exactly one owner:

```txt
core
site-shell
admin-shell
app-shell
plugin-blog
plugin-pricing
plugin-contact
plugin-scrollytelling
plugin-portfolio
plugin-faq
plugin-team
plugin-testimonials
project
```

For Plan 1, plugins can remain physically inside PM core. The important first step is classification.

## Phase 0: Classification

Create an ownership manifest and classify broad paths without moving runtime files.

Initial manifest should identify:

- PM config as `project`
- CSS primitives/base system as `core`
- public site sections/modules as plugin-owned or site-shell-owned
- admin pages/layouts/APIs as `admin-shell`
- app shell behavior as `app-shell`
- auth/session/RBAC/audit/setup/security as `core`

## Phase 1: Move Project Config

Move:

```txt
app/puppet-master.config.ts
```

to:

```txt
project/puppet-master.config.ts
```

Then update all runtime references immediately:

- `nuxt.config.ts`
- `i18n/i18n.config.ts`
- server imports
- setup guard/config APIs
- workflow scripts
- config reader/writer utilities
- tests that mock or locate the config

The old path must not exist after this phase.

## Phase 2: Project Assets And Content

Move only clearly project-specific assets/content after Phase 1 is stable.

Likely candidates:

- project logos
- project OG images
- project copy/content fixtures
- custom one-off sections

Do not move shared PM visual primitives yet.

## Phase 3: Nuxt Layer Split

Create:

```txt
pm-core/
```

Move framework-owned app code into the layer and update `nuxt.config.ts` to use Nuxt `extends`.

This phase must update:

- CSS entry paths
- i18n paths
- component/page/composable discovery expectations
- PurgeCSS content paths
- test paths
- Storybook paths if needed

## Phase 4: Server Split

Move PM-owned server code into the PM core layer.

Keep project-owned server code in the project layer.

Update:

- Nitro discovery
- Drizzle schema composition
- seed/migration paths
- tests

## Phase 5: Built-In Module Organization

Organize modules under PM ownership:

```txt
pm-core/modules/blog
pm-core/modules/pricing
pm-core/modules/contact
pm-core/modules/scrollytelling
```

They are not separate packages yet. This keeps Plan 1 practical while preparing for Plan 2.

## Validation Commands

Use targeted validation after each phase:

```bash
rg "app/puppet-master.config|./app/puppet-master.config|~~/app/puppet-master.config|~/puppet-master.config"
npm run lint
npm run test:unit
npm run build
```

If the full validation is too expensive during early migration, at minimum run the stale-path search and TypeScript/build-oriented checks before continuing.

## Current First Slice

Implement now:

1. Add ownership manifest scaffold.
2. Move `puppet-master.config.ts` into `project/`.
3. Update runtime code to the new canonical path.
4. Confirm old config path is gone.
5. Run stale-reference search and targeted validation.
