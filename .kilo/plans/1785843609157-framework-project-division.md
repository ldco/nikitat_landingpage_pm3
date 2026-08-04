# Framework / Project Division Plan

**Goal:** Clean boundary between reusable PM3 framework and site-specific project layer.
**Current:** PM3 is a template — project values mixed into framework files. 86% framework, 14% project/mixed.
**Target:** Project files inject identity into framework. Framework upgrades never touch project files.

## Architecture

```
src/                        ← FRAMEWORK (never edited by project)
├── app.css                 ← imports project theme, owns all @utility + @layer
├── lib/
│   ├── components/         ← all atoms, molecules, complex, sections (except project-specific)
│   ├── config/site.ts      ← types + helpers + project config import
│   ├── stores/             ← all reactive stores
│   ├── actions/            ← all Svelte actions
│   ├── utils/              ← all client utilities
│   ├── server/             ← all server code (DB, auth, storage, email, etc.)
│   └── i18n.ts             ← re-exports Paraglide messages
├── routes/                 ← all pages (framework structures, project content flows through)
└── hooks.server.ts         ← framework server hooks

src/project/                ← PROJECT (edit to customize site)
├── theme.css               ✅ DONE — 4 brand primitives
├── site-config.ts          ← project config values (locales, nav, modules, features)
├── content.ts              ← already exists as i18n/content.ts (move here)
├── SectionF22.svelte       ← project-specific section
├── FallingLetters.svelte   ← project-specific effect
├── HeroParallaxScene.svelte
├── gsapIntro.ts
└── overrides.ts            ← component override registry (future)
```

## Phase 1: site.ts Complete Split

**Problem:** site.ts has 442 lines with types + framework defaults + project values all in one file.  
**Solution:** Project values move to `src/project/site-config.ts`. Framework imports + re-exports.

### 1.1 Map site.ts exports to project vs framework

Read every export from site.ts and classify:
- `HOMEPAGE_SECTIONS`, `NAV_ITEMS`, `LOCALES`, `DEFAULT_LOCALE`, `FEATURES`, `MODULES`, `LOGO`, `CONTACT`, `FOOTER_MADE_BY`, `PM_MODE`, `SEO`, `LOCALE_STRINGS` → **PROJECT**
- `FRAMEWORK`, `HEADER_CONTACT`, `STORAGE_CONFIG`, `ADMIN_CONFIG` → **FRAMEWORK** (with project-configurable defaults)
- All interfaces (`HomepageSection`, `NavItem`, `ModuleConfig`, `Features`, `AdminConfig`) → **FRAMEWORK**
- All helpers (`isOnepager`, `getEnabledModules`, `resolveSectionHref`, `getNavItems`, `isRtlLocale`) → **FRAMEWORK**

### 1.2 Update project/site-config.ts to match framework types

The current `src/project/site-config.ts` draft has type mismatches:
- `Features` interface has 30 fields — must match exactly
- `ModuleConfig` requires `config: Record<string, unknown>` — must include
- `NavItem` uses `section` not `matcher` — match the type

### 1.3 Wire imports in site.ts

```ts
// site.ts
import { LOCALES, DEFAULT_LOCALE, FEATURES, MODULES, ... } from '../../project/site-config'
export { LOCALES, DEFAULT_LOCALE, FEATURES, MODULES, ... }
```

### 1.4 Verify all 20+ consumers of site.ts compile

Files importing from `$lib/config/site`:
- `+page.svelte`, `+layout.svelte`
- `TheHeader.svelte`, `TheFooter.svelte`, `SectionRenderer.svelte`
- `LangSwitcher.svelte`, `NavLinks.svelte`, `CtaButton.svelte`, `CookieConsent.svelte`
- `settings-schema.ts`, `setup-guard.ts`, `admin-rbac.ts`
- All admin API routes

### 1.5 Test: change one value in project/site-config.ts, verify site updates

---

## Phase 2: Project Component Extraction

### 2.1 Move SectionF22 → src/project/

- Move `src/lib/components/sections/SectionF22.svelte` → `src/project/SectionF22.svelte`
- Remove from `sections/` directory
- Create project component registry in `src/project/overrides.ts`:
  ```ts
  export const PROJECT_COMPONENTS = {
    SectionF22: () => import('./SectionF22.svelte'),
  }
  ```
- Update `SectionRenderer.svelte`: check override registry before falling back to framework component

### 2.2 Decouple FallingLetters from +layout.svelte

Current: `+layout.svelte` imports `FallingLetters` directly from `../project/`.
Framework layout should NOT know about project components.

Solution: Framework provides a `<ProjectAmbient>` slot component.
```svelte
<!-- +layout.svelte -->
<ProjectAmbient />  <!-- renders project-specific ambient effects -->
<!-- ProjectAmbient.svelte (in project/) -->
{#if FEATURES.fallingLetters}
  <FallingLetters />
{/if}
```

Or: Framework checks if `src/project/ambient.svelte` exists and renders it.

---

## Phase 3: Paraglide Messages Split

**Problem:** `messages/*.json` has both framework UI strings and project content strings.

### 3.1 Identify framework vs project keys

| Prefix | Classification |
|--------|---------------|
| `nav_*`, `common_*`, `auth_*`, `cookies_*`, `theme_*`, `validation_*`, `setup_*`, `pricing_*`, `admin_*` | Framework |
| `sections_hero`, `sections_about`, `sections_contact`, `cta_*`, `footer_*` | Mixed (some are project content) |
| `legal_*`, `locale_*` | Framework |

### 3.2 Extract project-specific Paraglide keys

Move project content strings to `src/project/messages/` (per locale).
Framework messages stay in `messages/`.

### 3.3 Paraglide config update

Create `src/project/paraglide.config.ts` that merges framework + project messages.

---

## Phase 4: i18n Content Boundary

**Problem:** `i18n/content.ts` has project text. `i18n/db-translations.json` has both framework admin UI + project SEO/contact labels.

### 4.1 Move content.ts to project layer

Already in the right place — `i18n/content.ts` is project content. Just document it.

### 4.2 Split db-translations.json

The seed file has `admin.*`, `settings.*`, `blog.*`, `portfolio.*` (framework admin UI translations) mixed with `seo.*`, `contact.*` labels (project content).

Goal: Framework ships with system-seed.json (admin UI only). Project content translations are separate.

---

## Phase 5: Document the Boundary

### 5.1 Create `src/project/README.md`

```md
# Project Layer — nikitat.pro

Edit these files to customize the site:

- theme.css — brand colors (4 primitives)
- site-config.ts — locales, nav, modules, features
- content.ts — hero text, about, focus cards, contact labels
- SectionF22.svelte — Fabrica22 partnership section
- FallingLetters.svelte — animated logo effect
- HeroParallaxScene.svelte — parallax cloud layers

Never edit files in src/ (except src/project/).
```

### 5.2 Create `docs/framework-project-boundary.md`

Full documentation for creating a new PM3 site from the framework.

---

## Implementation Order

```
Phase 1 (site.ts split)      ← unblocks everything
  ├─ Phase 2 (component extraction)
  ├─ Phase 3 (messages split)
  └─ Phase 4 (i18n boundary)
Phase 5 (documentation)       ← last, after all splits verified
```

## Verification Per Phase

```
Each phase must pass:
  npm run check  — 0 errors
  npm run build  — succeeds
  npm run test   — 36/36 pass
  pre-commit     — passes
  site (/:200)   — renders correctly
```

## Success Criteria (End State)

1. Create new PM3 site: copy `src/project/` to new project, edit 4+ files, done
2. Change brand colors: edit `project/theme.css` (4 values), all colors auto-update
3. Change locale config: edit `project/site-config.ts`, nav + sections adapt
4. Add project component: drop in `src/project/`, register in overrides.ts
5. Framework upgrade: `npm update @puppet-master/core` (future), project files untouched
