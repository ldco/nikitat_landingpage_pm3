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
- `content.ts` — all site text (hero, about, focus, f22, contact, seo)
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
| Content | Renders via content store (`t()`) | Provides text in `content.ts` |
| Components | SectionRenderer, layout shells | Registers overrides in `overrides.ts` |
| Text | UI labels in `messages/*.json` | Site text in `content.ts` |

## Rebranding checklist (new PM3 site)

1. Edit `src/project/theme.css` — 4 color primitives
2. Edit `src/project/site-config.ts` — locales, nav, sections, modules, features
3. Edit `src/project/content.ts` — all site text
4. Edit `src/project/overrides.ts` — register custom components
5. Replace `public/` brand assets
6. Done — no framework edits required

## Upgrading the framework

When the framework ships a new version (future `@puppet-master/core` package):

1. `npm update @puppet-master/core`
2. Project files untouched — no merge conflicts
3. All sites get framework improvements simultaneously
