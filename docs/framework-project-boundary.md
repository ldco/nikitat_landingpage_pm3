# PM3 Framework / Project Boundary

## The Two Layers

```
src/                     ← FRAMEWORK (reusable, shared, never edited per-site)
└── project/             ← PROJECT (site identity, owned by site)
```

The framework provides structure and behavior. The project injects identity
(colors, content, config, brand components). Framework upgrades never touch
project files; project changes never require framework edits.

## What belongs where

### Framework (`src/` — everything except `src/project/`)

- **Components**: atoms, molecules, complex, sections (generic, config-driven)
- **Stores**: theme, content, settings, admin, navigation
- **Actions**: reveal, scrollHeader, scrollSpy, scrollyScene, parallax
- **Utils**: auth, navigation, legal-documents, titleBreaker, admin-paths
- **Server**: DB, auth, security, storage, email, telegram, audit, forms
- **Routes**: all pages (framework structures, render project content via stores)
- **Config**: `site.ts` types + helpers, `settings-schema.ts`, framework defaults
- **CSS**: `app.css` structural tokens, @utility, @layer, keyframes (imports project theme)
- **i18n**: `messages/*.json` UI strings, `i18n/system-seed.json` admin translations

### Project (`src/project/`)

- `theme.css` — 4 brand primitives
- `site-config.ts` — locales, nav, sections, modules, features, admin, logo
- `content.json` — all site text (data file: hero, about, focus, f22, contact, seo)
- `SectionF22.svelte` — brand partnership section
- `FallingLetters.svelte`, `HeroParallaxScene.svelte` — brand effects
- `ProjectAmbient.svelte` — root layout ambient wrapper
- `overrides.ts` — component override registry
- `public/logos/`, `public/madebylogos/`, `public/uploads/`, `public/images/` — brand assets

## How the layers interact

| Concern | Framework | Project |
|---------|-----------|---------|
| Colors | Derives ALL colors via `color-mix()` from 4 primitives | Sets the 4 primitives in `theme.css` |
| Config | Types + helpers in `site.ts` | Values in `site-config.ts` |
| Content | Renders via content store (`t()`) | Provides text in `content.json` (seed → DB) |
| Components | SectionRenderer resolves `SECTION_REGISTRY[component]` + spreads props from the prop-adapter (`sections/props.ts`) | Registers sections in `project/registry.ts` (`PROJECT_SECTIONS`) |
| Text | UI labels in `messages/*.json` | Site text in `content.json` → DB |

### Adding a project section — no framework edits

1. Create the component in `src/project/` (e.g. `src/project/SectionBrand.svelte`)
2. Register it in `src/project/registry.ts` → `PROJECT_SECTIONS = { SectionBrand }`
3. Add it to `HOMEPAGE_SECTIONS` in `src/project/site-config.ts`

SectionRenderer has **no component-name dispatch**: it resolves the component
directly from `SECTION_REGISTRY[section.component]` and spreads the props built
by the typed prop-adapter (`src/lib/components/sections/props.ts`). The adapter
maps each **data-backed** framework section to its slice of `SectionContent`
(`items`, `posts`, `features`, `tiers`, `members`, `testimonials`, `clients`).
Content-less and project sections receive `{}` — a new project section renders
with zero framework changes. `tests/lib/components/section-registry.test.ts`
proves this: no framework file may name a project component, and unknown
components resolve to `{}` props.

## Rebranding checklist (new PM3 site)

1. Edit `src/project/theme.css` — 4 color primitives
2. Edit `src/project/site-config.ts` — locales, nav, sections, modules, features
3. Edit `src/project/content.json` — all site text, run `npm run db:reset`
4. Edit `src/project/overrides.ts` — register custom components
5. Replace `public/` brand assets
6. Done — no framework edits required

## Upgrading the framework

When the framework ships a new version (future `@puppet-master/core` package):

1. `npm update @puppet-master/core`
2. Project files untouched — no merge conflicts
3. All sites get framework improvements simultaneously
