# Project Layer — nikitat.pro

This directory is the **project layer** of PM3. It contains everything specific to
this site. The framework (everything outside `src/project/`) is reusable across
all PM3 sites.

## Files — what to edit to customize

| File | What it controls |
|------|-----------------|
| `theme.css` | Brand colors — **4 primitives**. Change to rebrand the entire site. |
| `site-config.ts` | Locales, navigation, homepage sections, modules, features, admin config, logo |
| `content.json` | All site text (data file): hero, about, focus, f22, contact, seo (4 locales) |
| `SectionF22.svelte` | Fabrica22 partnership section (registered in `registry.ts`) |
| `FallingLetters.svelte` | Animated falling-letters ambient effect |
| `HeroParallaxScene.svelte` | Parallax cloud layers in hero |
| `ProjectAmbient.svelte` | Root layout ambient wrapper (renders FallingLetters) |
| `registry.ts` | Project section registration — **the only extension point** |

## Rules

1. **Never edit files outside `src/project/`** to customize this site.
   That code is framework-owned and shared across PM3 sites.
2. To add a custom section: create it here, register it in `registry.ts`
   (`PROJECT_SECTIONS`), then add it to `HOMEPAGE_SECTIONS` in `site-config.ts`.
3. Ambient effects and hero scenes are wired via direct imports
   (`ProjectAmbient.svelte` → `FallingLetters.svelte`, `SectionHero` →
   `HeroParallaxScene.svelte`) — no registry needed for those.
4. Framework upgrades (`@puppet-master/core` updates) never touch this directory.

## Creating a new PM3 site

1. Copy this directory to the new project.
2. Edit `theme.css` (4 colors).
3. Edit `site-config.ts` (locales, nav, sections, modules).
4. Edit `content.json` (site text), run `npm run db:reset`.
5. Replace `public/logos/`, `public/madebylogos/`, `public/uploads/`, `public/images/`.
6. Done — framework handles everything else.
