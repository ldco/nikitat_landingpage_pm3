# Phase 3 — CSS Foundation: PM v2 → Tailwind Design Tokens

## Architecture Rule

```
PM v3 CSS Architecture:
  1. app.css @theme    → Design tokens (colors, spacing, typography, shadows, etc.)
  2. app.css @layer base → HTML/body reset, focus-visible, smooth scroll
  3. app.css @keyframes → Animation definitions
  4. Svelte components  → Styles live INSIDE .svelte files as Tailwind utilities
                          using design tokens. class prop + twMerge for overrides.
  5. NO global .btn/.card/.section BEM classes — components ARE the reuse unit.
```

Container utility classes (`.container-wide`, `.container-narrow`) are KEPT temporarily
in `@layer components` until Phase 4 creates the `<Container>` atom and refactors
all 16 component usages. Then removed.

## Source Material

PM v2 CSS at `../app-nuxt/app/assets/css/`. ~100 files across 5 layers.
These are the REFERENCE — we translate their VISUAL DESIGN into Tailwind.

---

## Step 3.1 — Design Tokens (@theme)

**File:** `src/app.css` — replace the @theme block (lines 13-67).

Translate every PM v2 variable:

### Colors
(from `colors/primitives.css` + `colors/auto.css`)
```
--color-pm-black: #3b0902
--color-pm-white: #fbf2e7
--color-pm-brand: #901504
--color-pm-accent: #901504
--color-pm-brand-light: color-mix(in srgb, #901504, #ffffff 15%)
--color-pm-brand-dark: color-mix(in srgb, #901504, #000000 10%)
--color-pm-brand-subtle: light-dark(
  color-mix(in srgb, #901504, transparent 90%),
  color-mix(in srgb, #901504, transparent 85%)
)

--color-pm-gray-50 through --color-pm-gray-900 (keep existing — used in admin)

--color-pm-bg: light-dark(var(--color-pm-white), var(--color-pm-black))
--color-pm-bg-elevated: light-dark(
  color-mix(in oklch, var(--color-pm-white), var(--color-pm-black) 3%),
  color-mix(in oklch, var(--color-pm-black), var(--color-pm-white) 5%)
)
--color-pm-bg-sunken: light-dark(
  color-mix(in oklch, var(--color-pm-white), var(--color-pm-black) 6%),
  color-mix(in oklch, var(--color-pm-black), var(--color-pm-white) 2%)
)
--color-pm-surface: var(--color-pm-bg-elevated)
--color-pm-border: light-dark(
  color-mix(in oklch, var(--color-pm-black), transparent 88%),
  color-mix(in oklch, var(--color-pm-white), transparent 85%)
)
--color-pm-border-strong: light-dark(
  color-mix(in oklch, var(--color-pm-black), transparent 75%),
  color-mix(in oklch, var(--color-pm-white), transparent 70%)
)

--color-pm-text: light-dark(var(--color-pm-black), var(--color-pm-white))
--color-pm-text-secondary: light-dark(#664d42, #c4a498)
--color-pm-text-muted: light-dark(#8c7568, #9a7a6e)
--color-pm-muted: var(--color-pm-text-muted)
--color-pm-muted-dark: #9ca3af  (legacy alias, keep for admin)

--color-pm-success: oklch(65% 0.2 145)
--color-pm-success-bg: light-dark(oklch(95% 0.05 145), oklch(25% 0.05 145))
--color-pm-warning: oklch(75% 0.15 85)
--color-pm-warning-bg: light-dark(oklch(95% 0.05 85), oklch(25% 0.05 85))
--color-pm-danger: oklch(55% 0.22 25)
--color-pm-danger-bg: light-dark(oklch(95% 0.05 25), oklch(25% 0.05 25))
--color-pm-info: oklch(60% 0.18 250)
--color-pm-info-bg: light-dark(oklch(95% 0.05 250), oklch(25% 0.05 250))

--color-pm-focus-ring: color-mix(in srgb, var(--color-pm-brand), transparent 50%)
```

### Typography
(from `typography/variables.css`)
```
--font-sans: 'Geologica', 'Inter Variable', 'Inter', system-ui, -apple-system,
  BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
--font-display: var(--font-sans)
--font-mono: 'JetBrains Mono', 'Fira Code', monospace

--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1.25rem            ← PM v2 uses 20px base!
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
--text-3xl: 1.875rem
--text-4xl: 2.25rem
--text-5xl: 3rem

--font-weight-light: 300
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
--font-weight-black: 900

--leading-small: 0.8
--leading-tight: 1.25
--leading-normal: 1.5
--leading-relaxed: 1.625
```

### Spacing, Shadows, Radius, Z-Index
(from `common/spacing.css`)
```
--spacing-0: 0, --spacing-px: 1px, --spacing-0-5: 0.125rem
--spacing-1: 0.25rem through --spacing-32: 8rem (4px base scale)

--shadow-sm: 0 1px 2px oklch(0% 0 0 / 5%)
--shadow-md: 0 4px 6px -1px oklch(0% 0 0 / 7%), 0 2px 4px -2px oklch(0% 0 0 / 6%)
--shadow-lg: 0 10px 15px -3px oklch(0% 0 0 / 10%), 0 4px 6px -4px oklch(0% 0 0 / 5%)
--shadow-xl: 0 20px 25px -5px oklch(0% 0 0 / 10%), 0 8px 10px -6px oklch(0% 0 0 / 4%)

--radius-xs: 0.25rem, --radius-sm: 0.375rem, --radius-md: 0.5rem
--radius-lg: 0.75rem, --radius-xl: 1rem, --radius-full: 9999px

--z-base: 1, --z-dropdown: 100, --z-sticky: 200, --z-fixed: 300
--z-drawer-backdrop: 400, --z-drawer: 500
--z-modal-backdrop: 600, --z-modal: 700
--z-popover: 800, --z-toast: 900
```

### Transitions & Easings
(from `common/spacing.css`)
```
--transition-fast: 150ms, --transition-normal: 200ms
--transition-slow: 300ms, --transition-slower: 400ms

--ease-out: cubic-bezier(0.33, 1, 0.68, 1)
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

### Container Widths
(from `layout/containers.css`)
```
--container-narrow: 48rem, --container-default: 80rem, --container-wide: 96rem
```

---

## Step 3.2 — Base Layer (@layer base)

**File:** `src/app.css` — replace @layer base block (lines 69-105).

Translate from PM v2 `reset.css`:
```css
@layer base {
  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-padding-top: 72px;  /* header height for anchor links */
  }

  body {
    @apply bg-pm-bg text-pm-text antialiased;
    font-family: var(--font-sans);
  }

  /* Dark mode body */
  .dark body {
    @apply bg-pm-black text-pm-white;
  }

  a {
    @apply text-pm-brand transition-colors duration-150;
    text-decoration: none;
  }
  a:hover { @apply text-pm-brand-light; }

  *, *::before, *::after {
    border-color: var(--color-pm-border);
  }

  .dark *, .dark *::before, .dark *::after {
    border-color: var(--color-pm-border);
  }

  :focus-visible {
    outline: 2px solid var(--color-pm-focus-ring);
    outline-offset: 2px;
  }
}
```

---

## Step 3.3 — Container Classes (KEEP temporarily)

**Do NOT remove** the @layer components block. 16 components depend on these classes:
- TheHeader (2 usages), TheFooter, CookieConsent
- SectionAbout, SectionFocus, SectionF22, SectionPortfolio, SectionBlog
- SectionFeatures, SectionFaq, SectionPricing, SectionTeam, SectionTestimonials
- SectionClients, SectionContact

Plan: Phase 4 creates `<Container>` atom + refactors all usages.
Then the @layer components block is removed.

---

## Step 3.4 — Keyframe Animations

Add to `src/app.css` (from PM v2 `animations/keyframes.css`):
- Already have: fade-in, fade-in-up/down, scale-in, slide-up/down, pulse-soft, spin-slow
- Add if missing: formStatusSlideIn, formStatusSpin
- Defer to Phase 8: reveal animations, scrollytelling, page transitions

---

## Step 3.5 — Hamburger Animations

Already in `src/app.css`. Verify match with PM v2 `ui/hamburger.css`.
All 12 animation types present: spin, elastic, slider, spring, squeeze, arrow,
arrow-right, collapse, minus, turn, cross + base hamburger.

---

## Step 3.6 — Font Faces

Already via `@fontsource` packages. Verify in `src/app.css`:
```css
@import "@fontsource-variable/inter";
@import "@fontsource-variable/heebo";
@import "@fontsource/geologica";
@import "@fontsource/jetbrains-mono";
```
Match PM v2 `typography/font-faces.css` declarations.

---

## Document Fixes

### Fix A: `docs/MIGRATION_STEP_BY_STEP.md` — Replace Phase 3 section

Lines 247-290: replace the entire Phase 3 block (`## Phase 3: CSS & UI Kit...` through Step 3.4)
with phase description matching THIS plan (5 steps: tokens, base, keep containers,
keyframes, hamburger, fonts).

Key changes:
- Remove Step 3.2 "PM Components Layer (@layer components)" entirely
- Remove `.btn`, `.card`, `.section` class creation
- New Step 3.2 = @layer base (was old 3.2)
- New Step 3.3 = keep container classes (temporary)
- Update Phase 4 header: "REWRITE with translated PM v2 styles"

### Fix B: `docs/MIGRATION_STEP_BY_STEP.md` — Phase summary table

Line 687: replace `| 3 — CSS & UI Kit | 4 | Tailwind @theme + PM @layer components + hamburger + fonts |`
with: `| 3 — CSS Foundation | 6 | @theme tokens + @layer base + keyframes + hamburger + fonts |`

### Fix C: Remove orphaned Nuxt i18n config

Delete `i18n/i18n.config.ts` (imports deleted `project/puppet-master.config.ts`).
Delete `i18n/loader.ts` (old Nuxt composable, uses deleted `~/composables/apiFetch`).
Keep: `i18n/system-seed.json`, `i18n/db-translations.json`, `i18n/content.ts`,
`i18n/system.ts` (already updated in Phase 2).

---

## CSS → Component Translation Map (Phase 4+)

| PM v2 CSS | Svelte Component | |
|---|---|---|
| `ui/forms/buttons.css` | `atoms/CtaButton.svelte` | REWRITE |
| `ui/forms/inputs.css` | `atoms/FormField.svelte` | REWRITE |
| `ui/content/cards.css` | `atoms/Card.svelte` | NEW atom |
| `ui/content/badges.css` | `atoms/Badge.svelte` | NEW atom |
| `ui/content/avatars.css` | `atoms/Avatar.svelte` | NEW atom |
| `ui/content/tabs.css` | `molecules/Tabs.svelte` | NEW, Phase 5 |
| `ui/overlays/modal.css` | `molecules/Modal.svelte` | REWRITE, Phase 5 |
| `ui/overlays/toast.css` | `complex/ToastContainer.svelte` | REWRITE, Phase 5 |
| `ui/overlays/lightbox.css` | `molecules/PortfolioLightbox.svelte` | REWRITE, Phase 5 |
| `ui/hamburger.css` | `atoms/HamburgerIcon.svelte` | REWRITE, Phase 4 |
| `skeleton/header.css` | `complex/TheHeader.svelte` | REWRITE, Phase 5 |
| `skeleton/footer.css` | `complex/TheFooter.svelte` | REWRITE, Phase 5 |
| `layout/containers.css` | `atoms/Container.svelte` | NEW atom, Phase 4 |
| `layout/sections.css` | `atoms/Section.svelte` | NEW atom, Phase 4 |
| `ui/content/data-table.css` | `molecules/DataTable.svelte` | NEW, Phase 10 |
| `ui/content/page-header.css` | `atoms/PageHeader.svelte` | NEW, Phase 10 |

---

## Verification Checklist

- [ ] `npm run check` → 0 errors
- [ ] `npm run build` → 0 errors
- [ ] `bg-pm-brand` renders `#901504` (FABRICA22 red), NOT `#0066cc` (blue)
- [ ] `bg-pm-bg` renders `#fbf2e7` light / `#3b0902` dark
- [ ] No `.btn`, `.card`, `.section` BEM classes exist in app.css
- [ ] `container-wide` and `container-narrow` classes still work (temporary)
- [ ] MIGRATION_STEP_BY_STEP.md updated
- [ ] Orphaned Nuxt i18n files deleted
