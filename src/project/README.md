# Project Layer — nikitat.pro

This directory is the **project layer** of PM3. It contains everything specific to
this site. The framework (everything outside `src/project/`) is reusable across
all PM3 sites.

## Files — what to edit to customize

| File | What it controls |
|------|-----------------|
| `theme.css` | Brand colors — **4 primitives**. Change to rebrand the entire site. |
| `site-config.ts` | Locales, navigation, homepage sections, modules, features, admin config, logo |
| `content.ts` | All site text: hero, about, focus cards, f22, contact, seo (4 locales) |
| `SectionF22.svelte` | Fabrica22 partnership section |
| `FallingLetters.svelte` | Animated falling-letters ambient effect |
| `HeroParallaxScene.svelte` | Parallax cloud layers in hero |
| `ProjectAmbient.svelte` | Root layout ambient wrapper (renders FallingLetters) |
| `overrides.ts` | Component override registry (project → framework) |

## Rules

1. **Never edit files outside `src/project/`** to customize this site.
   That code is framework-owned and shared across PM3 sites.
2. To customize framework behavior: override in `src/project/`, register in `overrides.ts`.
3. Framework upgrades (`@puppet-master/core` updates) never touch this directory.

## Creating a new PM3 site

1. Copy this directory to the new project.
2. Edit `theme.css` (4 colors).
3. Edit `site-config.ts` (locales, nav, sections, modules).
4. Edit `content.ts` (site text).
5. Replace `public/logos/`, `public/madebylogos/`, `public/uploads/`, `public/images/`.
6. Done — framework handles everything else.
