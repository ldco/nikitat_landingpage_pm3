# PM3 Framework Architecture — From Copy-Paste to Composition

**Date:** 2026-08-03
**Status:** Proposed

---

## 1. Context

Puppet Master v3 (SvelteKit + Tailwind v4) has the right atoms, molecules, and tokens. But the sections — the largest, most visible building blocks — don't consume them. Every section duplicates:

- `<section class="flex flex-col items-center pt-[var(--pt-section)] pb-[var(--space-16)] bg-pm-bg-XXX">`
- `<div class="px-container w-full max-w-container mx-auto">`
- `<h2 class="section-title text-center">`

The framework has a `Section.svelte` atom (52 lines), a `Container.svelte` atom (56 lines), a `Grid.svelte` atom (58 lines), and a `section-title` utility. None are used. The `SectionRenderer` has a hardcoded if/else chain that ignores the project's `PROJECT_SECTION_COMPONENTS` registry.

**Root cause:** The abstractions exist but are too thin to be worth using. A `Section` atom that saves 2 Tailwind classes isn't compelling. A `Container` atom that saves 3 classes isn't either. The framework provides building blocks but not *composable patterns*.

**Goal:** Transform PMv3 from "a set of atoms you can use if you want" to "a section compositor that enforces consistency by making the right thing the easy thing."

---

## 2. C4 — Level 3: Component Architecture

```
ROOT LAYOUT (+layout.svelte)
├── SkipLink (atom)                     ← framework-mandated a11y
├── ProjectAmbient (project override)
├── TheHeader (complex)
├── <main id="main-content">
│     └── [page transition wrapper]
│           └── HOMEPAGE (+page.svelte)
│                 └── Onepager (complex)  ← NEW: extracts scene wrapping
│                       ├── SectionHero  (special — grid layout, not shell)
│                       └── SectionRenderer × N
│                             └── RESOLVES via registry map
│                                   └── RENDERS section component
│                                         ├── Section (atom shell)
│                                         │     ├── padding / background / scroll-margin / reveal
│                                         │     └── children slot
│                                         │           ├── SectionContent (molecule)  ← NEW
│                                         │           │     = Container(width) + reveal
│                                         │           │     └── SectionHeading (molecule) ← NEW
│                                         │           │     └── <section body>
│                                         │           └── or inline if custom layout
├── TheFooter (complex)
├── BackToTop (atom)
├── CookieConsent (complex)
└── ToastContainer (complex)
```

---

## 3. Architectural Anti-Patterns Detected

### AP-1: Shell Rejected by Consumers
**Symptom:** `Section.svelte` (52 lines) provides variant/background/id system. Zero of 13 sections use it. Every section inlines the markup.
**Pattern:** *Leaky Abstraction* — the shell saves too little to justify the indirection.
**Fix:** Enhance shell to apply `reveal` action and accept children. Make it the standard pattern. Still thin but now authoritatively controls background/padding/reveal — 3 concerns moved from each section into one place.

### AP-2: Registry Dead Code
**Symptom:** `PROJECT_SECTION_COMPONENTS` map exists in `overrides.ts` but `SectionRenderer` imports `SectionF22` via hardcoded `../../project/SectionF22.svelte` — ignoring the registry entirely.
**Pattern:** *Cargo Cult* — the registry pattern was copied from PMv2 but the consumption code wasn't wired.
**Fix:** Merge framework + project registries in `sections/registry.ts`. SectionRenderer reads from merged registry.

### AP-3: Onepager Rendering in Page
**Symptom:** `+page.svelte` contains scene-full-bleed wrapping logic, hero special-casing, and section iteration — SSR orchestration mixed into the route file.
**Pattern:** *God Object* (mild) — the page owns too many concerns.
**Fix:** Extract `Onepager.svelte` complex component that handles hero rendering + section chain.

### AP-4: Heading Pattern Duplicated 5×
**Symptom:** Every section has `<h2 class="section-title text-center">` with identical 5-class string. No heading molecule exists.
**Pattern:** *Copy-Paste Architecture* — the same markup repeated in 5 places with zero abstraction.
**Fix:** `SectionHeading.svelte` molecule: `title`, `align`, optional `eyebrow`.

### AP-5: Container Pattern Duplicated 5×
**Symptom:** Every section has `<div class="px-container w-full max-w-container mx-auto">` — 4 tokens duplicated.
**Pattern:** Same as AP-4.
**Fix:** `SectionContent.svelte` molecule: `Container` + `reveal` action. All sections use it.

---

## 4. ADRs

### ADR-001: Standard Section Shell

**Status:** Proposed

**Context:**
Every section currently inlines its own `<section>` root with flex-col, padding, background, scroll-mt, and reveal action. The framework has a `Section.svelte` atom that provides these but sections don't use it because:
1. It's too thin (saves ~2 classes)
2. It doesn't apply `reveal` action
3. SectionHero can't use it (needs grid, not flex-col)

**Decision:**
1. `Section` atom becomes AUTHORITATIVE. Every section MUST render its root via `<Section>`.
2. Section applies: `id`, `variant` ('section'|'fullscreen'), `background` ('none'|'default'|'elevated'|'sunken'|'brand'), `reveal`, `scroll-mt-0`.
3. Section applies `use:reveal` action internally (no need for each section to import it).
4. SectionHero is the ONLY exception — it uses its own root `<section>` because it needs `grid` layout.

**Options considered:**
1. Status quo (no enforcement) — rejected: inconsistent, each section decides its own padding/background
2. Section as opt-in wrapper — rejected: doesn't solve duplication in practice
3. Section as mandatory shell — **chosen**: forces consistency, eliminates 4 lines of duplicated markup per section

**Consequences:**
- ✅ Sections become visually consistent by default
- ✅ Changing section padding affects all sections at once
- ⚠️ SectionHero remains a special case (designated, documented exception)

---

### ADR-002: SectionContent + SectionHeading as Standard Inner Composition

**Status:** Proposed

**Context:**
After the `<Section>` shell, every section needs:
1. A content wrapper (`<div class="px-container w-full max-w-container mx-auto">`) with `reveal` animation
2. A heading (`<h2 class="section-title text-center">`) with optional alignment

These two patterns are duplicated in all 5 active homepage sections.

**Decision:**
1. CREATE `SectionContent.svelte` molecule:
   - Props: `width` ('default'|'narrow'|'wide'|'full'|'prose'), `class`, `children`
   - Renders: `<div use:reveal class="px-container w-full max-w-container mx-auto">` (adjusts max-w by width prop)
   
2. CREATE `SectionHeading.svelte` molecule:
   - Props: `title` (string), `align` ('center'|'start'), `eyebrow?` (string), `class`
   - Renders: `<h2 class="section-title text-{align}">`
   
3. All sections compose: `<Section><SectionContent><SectionHeading /><!-- body --></SectionContent></Section>`

**Options considered:**
1. Bake heading into Section shell — rejected: Section should be layout-only, not content-aware
2. Keep current inline pattern — rejected: 5× duplication, inconsistent
3. Separate SectionContent + SectionHeading molecules — **chosen**: clean composition, single responsibility each

**Consequences:**
- ✅ Sections drop from ~45 lines to ~30 lines
- ✅ Heading alignment changes propagate to all sections at once
- ✅ Section body width changes propagate to all sections at once

---

### ADR-003: Section Registry as Single Source of Truth

**Status:** Proposed

**Context:**
`SectionRenderer.svelte` has a 13-branch if/else chain with hardcoded imports. The `PROJECT_SECTION_COMPONENTS` registry in `overrides.ts` is unused — SectionRenderer imports `SectionF22` directly from `../../project/SectionF22.svelte`, bypassing the override system entirely.

Any future PM3 project that wants to override a section must edit `SectionRenderer.svelte` (a framework file) — violating the framework/project separation.

**Decision:**
1. Create `src/lib/components/sections/registry.ts`:
   ```ts
   import { PROJECT_SECTION_COMPONENTS } from '../../../project/overrides'
   import SectionAbout from './SectionAbout.svelte'
   // ... all framework section imports ...
   
   const FRAMEWORK_SECTIONS = { SectionAbout, SectionContact, SectionFocus, ... }
   export const SECTION_REGISTRY = { ...FRAMEWORK_SECTIONS, ...PROJECT_SECTION_COMPONENTS }
   ```
2. `SectionRenderer` imports `SECTION_REGISTRY`, dispatches via conditional chain using registry values (Svelte limitation — no runtime dynamic component dispatch for compiled components).
3. Project section overrides naturally replace framework sections without touching SectionRenderer.

**Options considered:**
1. Dynamic import (`await import(sectionComponentPath)`) — rejected: async, breaks SSR hydration
2. Dynamic component via `<svelte:component>` — rejected: Svelte 5 removed this, needs compile-time resolution
3. Registry + conditional dispatch — **chosen**: simplest working pattern, respects framework/project separation

**Consequences:**
- ✅ Projects override sections by editing ONLY `overrides.ts`
- ✅ Framework SectionRenderer never needs project-specific imports
- ⚠️ Still has a conditional chain (Svelte limitation), but it reads from a config map, not hardcoded paths

---

### ADR-004: Onepager as Framework Complex Component

**Status:** Proposed

**Context:**
`+page.svelte` contains: hero special-casing, `scene-full-bleed` wrapping, section iteration, and data passing. These are reusable onepager orchestration concerns, not route-specific logic.

**Decision:**
1. Create `complex/Onepager.svelte`:
   - Props: `sections: HomepageSection[]`, `content: SectionContent`
   - Renders: hero in first scene-full-bleed + SectionRenderer × N in scene-full-bleed
2. `+page.svelte` becomes thin:
   ```svelte
   <Onepager sections={enabledSections} content={data.sectionContent} />
   ```
3. SectionHero import moves from `+page.svelte` to `Onepager.svelte`.

**Options considered:**
1. Keep in +page.svelte — rejected: mixes orchestration with rendering, every PM3 project duplicates this pattern
2. Extract Onepager — **chosen**: reusable, testable, single responsibility

---

### ADR-005: Section Variant Model

**Status:** Proposed

**Context:**
Current `Section.svelte` has variants: `default`, `hero`, `fullscreen`. But:
- `default` and `hero` are identical (same classes)
- `hero` variant is misleading (SectionHero can't use Section shell because it needs grid)
- Background options are `default|alt|sunken|brand` — where `alt` = elevated, `default` = transparent

**Decision:**
1. Remove `hero` variant. Rename `default` → `section`.
2. Final types:
   ```ts
   type SectionVariant = 'section' | 'fullscreen'  // fullscreen adds min-h-dvh
   type SectionBackground = 'none' | 'default' | 'elevated' | 'sunken' | 'brand'
   ```
3. SectionHero is explicitly exempt from Section shell (documented exception — it uses grid layout).

**Options considered:**
1. Keep current model — rejected: misleading `hero` variant, unused
2. Refine to section/fullscreen — **chosen**: minimal, accurate, unambiguous

---

## 5. ISO 25010 Quality Attribute Evaluation

| Attribute | Current | Target | Risk |
|-----------|---------|--------|------|
| **Modularity** | ⚠️ Sections are islands — no shared structure, registry unused | ✅ Section shell enforced, registry consumed | Medium — requires refactoring 5 sections |
| **Reusability** | ⚠️ Each section is self-contained; no shared heading/wrapper | ✅ SectionContent + SectionHeading shared by all | Low |
| **Configurability** | ⚠️ Background/padding hardcoded per section | ✅ Config-driven via Section shell + site-config | Low |
| **Testability** | ✅ Sections are pure components (no API calls) | ✅ Maintained after refactor | Low |
| **Maintainability** | 🔴 Change to section padding requires editing 5+ files | ✅ Change in one token/file affects all sections | Medium |
| **Security** | ✅ Content sanitized, CSRF on forms, Zod validation | ✅ Maintained | Low |
| **Performance** | ✅ Sections are static components, no client-side data fetching | ✅ Maintained | Low |
| **Compatibility** | ✅ Works across 4 locales, RTL support | ✅ Maintained | Low |
| **Portability** | ✅ Framework/project separation via overrides | ✅ Enhanced by registry pattern | Low |

---

## 6. Trade-off Matrix

| Decision | Optimizes for | At the cost of |
|----------|--------------|----------------|
| Mandatory Section shell | Consistency, maintainability | Flexibility (SectionHero exempted) |
| SectionContent + SectionHeading | DRY, consistency | One extra component layer (marginal) |
| Registry over dynamic import | SSR stability, type safety | Conditional chain in renderer (~15 lines) |
| Onepager extraction | Clean +page.svelte, reuse | Extra file (worth it) |
| Token consolidation | Single source of truth | Short-term "where is this defined" confusion |

---

## 7. Implementation Plan (4 phases)

### Phase 1: New Framework Abstractions (3 new files)

| File | Type | Purpose |
|------|------|---------|
| `src/lib/components/molecules/SectionHeading.svelte` | NEW molecule | Standardized section title |
| `src/lib/components/molecules/SectionContent.svelte` | NEW molecule | Container + reveal wrapper |
| `src/lib/components/sections/registry.ts` | NEW module | Merged framework + project section registry |

### Phase 2: Refactor Existing Framework Files (3 modified files)

| File | Change |
|------|--------|
| `src/lib/components/atoms/Section.svelte` | Clean variants (remove `hero`), apply `use:reveal`, accept children via slot |
| `src/lib/components/complex/SectionRenderer.svelte` | Read from registry; dispatch via registry values (not hardcoded project paths) |
| `src/lib/components/complex/Onepager.svelte` | New complex — extract from +page.svelte |

### Phase 3: Refactor All 5 Active Sections (5 modified files)

All sections adopt: `<Section id={...} background={...}><SectionContent><SectionHeading title={...} align="center"/><!-- body --></SectionContent></Section>`

| Section | Old lines | New lines (est.) | Specific changes |
|---------|-----------|-------------------|------------------|
| `SectionAbout` | 45 | ~30 | Replace root `<section>`, container div, heading |
| `SectionFocus` | 57 | ~45 | Same + drops clsx/twMerge for div |
| `project/SectionF22` | 65 | ~45 | Same |
| `SectionContact` | 128 | ~110 | Same |
| `SectionHero` | 88 | 88 | **No change** — exempt from Section shell |

### Phase 4: Page Cleanup (2 files)

| File | Change |
|------|--------|
| `+page.svelte` | Replace manual scene wrapping with `<Onepager>` |
| `src/app.css` | Remove duplicate tokens (`--section-padding-top`), ensure single source |

---

## 8. Non-Goals (explicit scope boundaries)

- ❌ Not rewriting admin section components
- ❌ Not changing how SectionHero renders (grid layout exemption)
- ❌ Not modifying the header, footer, or layout chrome
- ❌ Not adding new Tailwind utilities — using existing token system
- ❌ Not changing the data flow (content store, settings store remain identical)
- ❌ Not adding new features (only refactoring existing)

---

## 9. Dependency Graph

```
Phase 1 (new abstractions)
    ↓
Phase 2 (refactor framework files)
    ↓
Phase 3 (refactor 5 active sections)
    ↓
Phase 4 (cleanup +page.svelte + tokens)
```

Phases 1-2 can be done as a single batch (new abstractions + Section/Registry/SectionRenderer refactor). Phases 3-4 follow naturally after Phase 2 gives sections the new primitives to consume.

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Section shell breaks visual parity | Low (shell preserves all existing token values) | Medium | Visual diff before/after with dev server screenshot comparison |
| Registry merge fails for project overrides | Low (simple object spread) | Low | TypeScript catches type mismatches |
| Onepager extraction misses edge case | Low (simple extract) | Low | Verify all 5 sections render in dev server |
| SectionHero doesn't work with new Section primitives | N/A (hero is exempt) | None | Documented exemption |

---

## 11. Verification Checklist

- [ ] `npm run check` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — success
- [ ] Dev server SSR: all 5 sections render
- [ ] Section backgrounds match PMv2 (hero = default, about = elevated, focus = sunken, f22 = default, contact = elevated)
- [ ] Section headings all use `section-title` utility
- [ ] Section padding consistent across all non-hero sections (`pt-section` token)
- [ ] SectionHero still has hero-specific padding (`pt-hero` token)
- [ ] `PROJECT_SECTION_COMPONENTS.SectionF22` overrides framework `SectionF22` transparently
- [ ] Skip link, cookie consent, theme toggle, lang switcher still work
- [ ] Mobile: hamburger drawer, focus grid, F22 section, contact form all responsive

---

## Implementation Status (2026-08-04)

All 4 phases implemented. Verification: `npm run check` 0 errors, `npm run lint` 0 errors, `npm run build` success, dev-server SSR renders all 5 sections via framework composition.

### New framework primitives

| File | Type | Role |
|------|------|------|
| `src/lib/components/atoms/Section.svelte` | REFACTORED | Mandatory section shell: variant (`section`/`fullscreen`), background (`none`/`default`/`elevated`/`sunken`/`brand`), applies `use:reveal`, scroll-mt-0, anchor id. `hero` variant removed (ADR-005). |
| `src/lib/components/molecules/SectionContent.svelte` | NEW | Standard inner wrapper = Container (width + `px-container`) composition. Reveal is owned by Section shell (avoids double animations). |
| `src/lib/components/molecules/SectionHeading.svelte` | NEW | `h2.section-title` pattern with `align` + optional `eyebrow`. |
| `src/lib/components/sections/registry.ts` | NEW | `SECTION_REGISTRY = { ...FRAMEWORK_SECTIONS, ...PROJECT_SECTION_COMPONENTS }` (ADR-003). |
| `src/lib/components/complex/SectionRenderer.svelte` | REFACTORED | Dispatches via `SECTION_REGISTRY` — project overrides win transparently, no framework edits. |
| `src/lib/components/complex/Onepager.svelte` | NEW | Extracted onepager orchestration from `+page.svelte` (ADR-004). |
| `src/lib/components/atoms/Container.svelte` | FIXED | Now applies `px-container` fluid padding (was missing — framework bug) + added `content` width (1000px). |
| `src/project/overrides.ts` | FIXED | `PROJECT_SECTION_COMPONENTS` typed `Record<string, Component>` (was `unknown` — registry couldn't consume it). |
| `src/routes/+page.svelte` | SIMPLIFIED | Thin: `<Onepager sections={...} content={...} />`. |
| `src/app.css` | CLEANED | Removed dead `--section-padding-top` (duplicate of `--pt-section`, ADR-006). |

### Sections now consume the framework

| Section | Shell | Background | Heading |
|---------|-------|-----------|---------|
| SectionAbout | `<Section id="about" background="elevated">` | ✅ | `<SectionHeading title align="center">` |
| SectionFocus | `<Section id="focus" background="sunken">` | ✅ | ✅ |
| SectionF22 (project) | `<Section id="f22">` + `width="content"` | ✅ | ✅ |
| SectionContact | `<Section id="contact" background="elevated">` | ✅ | ✅ |
| SectionHero | **exempt** — grid layout, own `pt-hero` token | — | — |

### Deviations from plan (documented)

1. **SectionContent has no reveal prop.** ADR-002 proposed "Container + reveal", but Svelte 5 forbids `use:` directives on components, and Section already applies reveal to the root — SectionContent would double-animate. Section owns reveal; SectionContent is pure Container composition.
2. **Container needed `px-container` padding** — it was missing (a framework bug). Every section previously added it manually. Now Container owns it.

### Verification results

- `npm run check` — 0 errors, 35 warnings (all pre-existing admin a11y)
- `npm run lint` — 0 errors (5 warnings: 4 generated paraglide + 1 sanitized `{@html}` false-positive)
- `npm run build` — success (validates registry member-expression dispatch `<REG.SectionX />`)
- SSR: 5 sections, 4× `section-title text-center`, 4× `pt-[var(--pt-section)]` + 1× `pt-[var(--pt-hero)]`, F22 project override resolved via registry, `has-scrolly-bg` + 5× `scene-full-bleed` from Onepager

---

## ADR-007: Project Registry — Single Live Registration Point

**Status:** Accepted (implemented 2026-08-04)

### Context

`src/project/overrides.ts` contained 4 exports, 3 of which were dead code with zero consumers:

| Export | Consumer | Status |
|--------|----------|--------|
| `PROJECT_SECTION_COMPONENTS` | `sections/registry.ts` | ✅ 1 consumer |
| `PROJECT_AMBIENT` | Nobody — layout imported `ProjectAmbient.svelte` directly | ❌ Dead |
| `PROJECT_SCENES` | Nobody — `SectionHero` imported `HeroParallaxScene.svelte` directly | ❌ Dead |
| `export default` | Nobody | ❌ Dead |

The ambient and scene chains were already correct via direct imports:
- `+layout.svelte → ProjectAmbient.svelte → FallingLetters.svelte`
- `SectionHero.svelte → HeroParallaxScene.svelte`

The registries were noise. The file name "overrides" was wrong for all 3 exports (none were true overrides — SectionF22 is a project addition to the framework catalog, not a replacement).

### Decision

1. Delete `overrides.ts`.
2. Create `src/project/registry.ts` with a single export: `PROJECT_SECTIONS` — the one thing that actually needs a shared registration.
3. Rename `PROJECT_SECTION_COMPONENTS` → `PROJECT_SECTIONS` (it was an addition, never an override).
4. Keep ambient and scene chains as direct imports (they work, no registry needed).

### Consequences

- ✅ One less dead-code file in the project
- ✅ The registry only contains things that need a registry
- ✅ "Override" language removed from codebase (no overrides exist)
- ✅ Direct imports for ambient/scenes are simpler and correct

---

## Implementation Status (Updated 2026-08-04)

### Completed framework changes

| File | Change |
|------|--------|
| `src/project/overrides.ts` | **DELETED** — dead code (3/4 exports had zero consumers) |
| `src/project/registry.ts` | **NEW** — single export: `PROJECT_SECTIONS = { SectionF22 }` |
| `src/lib/components/sections/registry.ts` | Updated import path + renamed to `PROJECT_SECTIONS` |
| `src/lib/components/complex/SectionRenderer.svelte` | JSDoc language fixed ("overrides" → "sections") |
| `src/app.css` | Removed dead `--section-padding-top` token |

### Import chains (all verified working)

```
Framework → Project:
  SectionRenderer  → sections/registry.ts → project/registry.ts → SectionF22      ✅
  +layout.svelte   → ProjectAmbient.svelte → FallingLetters.svelte                ✅ (direct)
  SectionHero      → HeroParallaxScene.svelte                                      ✅ (direct)
```

### Verification (final)
- `npm run check` — 0 errors, 35 pre-existing warnings
- `npm run lint` — 0 errors
- `npm run build` — success
- SSR: all 5 sections render, F22 resolved via registry, ambient/scenes via direct imports
