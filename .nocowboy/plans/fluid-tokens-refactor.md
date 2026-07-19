# Fluid Tokens Refactor — Remove ALL Arbitrary Values

**Problem:** 163 arbitrary values in codebase. `text-[clamp(...)]`, `h-[...]`, `max-w-[...]` are inline CSS disguised as Tailwind. They bypass the design system.

**Solution:** Define tokens in @theme, use them in components. Zero arbitrary values for sizing/typography/spacing.

---

## STEP 1: Add tokens to app.css @theme block

Add BEFORE the closing `}` of @theme (line 153):

```css
  /* --- Fluid Typography — DYNAMIC sizing --- */
  --text-fluid-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --text-fluid-sm: clamp(0.875rem, 0.8rem + 0.35vw, 1rem);
  --text-fluid-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --text-fluid-lg: clamp(1.125rem, 1rem + 0.6vw, 1.25rem);
  --text-fluid-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-fluid-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --text-fluid-3xl: clamp(1.75rem, 1.5rem + 1.875vw, 2.5rem);
  --text-fluid-4xl: clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem);
  --text-fluid-hero: clamp(2.5rem, 3vw + 1rem, 4.5rem);

  /* --- Fluid Spacing — DYNAMIC spacing --- */
  --spacing-fluid-xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem);
  --spacing-fluid-sm: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --spacing-fluid-md: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --spacing-fluid-lg: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);
  --spacing-fluid-xl: clamp(2rem, 1.5rem + 2.5vw, 4rem);
  --spacing-fluid-2xl: clamp(3rem, 2rem + 5vw, 6rem);
  --spacing-fluid-section: 3rem;

  /* --- Semantic Sizing --- */
  --h-header: clamp(3.5rem, 8vh, 4.5rem);
  --h-header-scrolled: clamp(3rem, 6vh, 3.5rem);
  --pt-section: calc(var(--h-header) + var(--spacing-fluid-2xl));
  --px-container: clamp(1rem, 3vw, 3rem);
  --max-w-container: min(80rem, 100%);
  --max-w-content: min(62.5rem, 100%);
  --max-w-narrow: min(48rem, 100%);
  --max-w-prose: min(65ch, 100%);
```

## STEP 2: Replace ALL arbitrary values in components

### Mapping table: OLD → NEW

| Old (arbitrary value) | New (token) | Used in |
|---|---|---|
| `text-[clamp(1.75rem,4vw,2.5rem)]` | `text-fluid-3xl` | All section titles (12 places) |
| `text-[clamp(2.5rem,6vw,4.5rem)]` | `text-fluid-hero` | SectionHero h1 |
| `text-[clamp(1.4rem,3.2vw,1.875rem)]` | `text-fluid-2xl` | SectionAbout, SectionF22 body |
| `text-[clamp(1.125rem,2.5vw,1.5rem)]` | `text-fluid-xl` | SectionHero subtitle |
| `text-[9px]` | `text-[9px]` (keep — not a fluid value, it's a badge size) | Admin contacts badge |
| `pt-[calc(clamp(56px,8vh,72px)+3rem)]` | `pt-section` | All 15 sections |
| `pt-[calc(72px+3rem)]` | `pt-section` | All sections |
| `h-[clamp(56px,8vh,72px)]` | `h-header` | TheHeader |
| `h-[clamp(48px,6vh,56px)]` | `h-header-scrolled` | TheHeader scrolled state |
| `min-h-[clamp(56px,8vh,72px)]` | `min-h-header` | TheHeader |
| `max-w-[1280px]` / `max-w-[80rem]` | `max-w-container` | Sections (10 places) |
| `max-w-[62.5rem]` | `max-w-content` | Admin pages (15 places) |
| `max-w-[65ch]` | `max-w-prose` | Blog, Legal (3 places) |
| `max-w-[min(768px,100%)]` | `max-w-narrow` | FAQ, Testimonials (2 places) |
| `max-w-[300px]` | Keep as-is (truncation) | Admin table cells |
| `px-[clamp(1rem,3vw,3rem)]` | `px-container` | All sections |
| `px-[max(1.5rem,calc((100vw-1280px)/2))]` | `px-container` | SectionHero |
| `w-[min(280px,85vw)]` | `w-drawer` (new) | Mobile drawer |
| `gap-[var(--gap-lg)]` | `gap-fluid-lg` | Section grids (6 places) |
| `gap-[var(--gap-xl)]` | `gap-fluid-xl` | Section grids |
| `backdrop-blur-[16px]` | Keep (CSS function, not sizing) | Header, Footer |
| `leading-[0.9]` | `leading-[0.9]` (keep — specific display font value) | SectionHero h1 |
| `z-[60]`, `z-[3]`, `z-[1]` | `z-60`, `z-[3]`, `z-10` | Various |
| `size-[44px]` | `size-touch` (new) | Buttons |
| `w-[4rem]` | `w-16` | Admin sidebar |
| `transition-[...]` | Keep (CSS properties, not sizing) | Transitions |

### Files to update (28 files, 163 replacements):

**Section components (13 files):**
- SectionAbout: text-fluid-3xl, text-fluid-2xl, pt-section, max-w-container, px-container
- SectionBlog: text-fluid-3xl, pt-section, max-w-container, px-container
- SectionClients: text-fluid-3xl, pt-section, max-w-container, px-container
- SectionContact: text-fluid-3xl, pt-section, max-w-container, px-container
- SectionF22: text-fluid-3xl, text-fluid-2xl, pt-section, max-w-container, px-container
- SectionFaq: text-fluid-3xl, pt-section, max-w-narrow, px-container
- SectionFeatures: text-fluid-3xl, pt-section, max-w-container, px-container
- SectionFocus: text-fluid-3xl, pt-section, max-w-container, px-container
- SectionHero: text-fluid-hero, text-fluid-xl, pt-section, px-container
- SectionPortfolio: text-fluid-3xl, pt-section, max-w-container, px-container
- SectionPricing: text-fluid-3xl, pt-section, max-w-container, px-container
- SectionTeam: text-fluid-3xl, pt-section, max-w-container, px-container
- SectionTestimonials: text-fluid-3xl, pt-section, max-w-narrow, px-container

**Complex components (2 files):**
- TheHeader: h-header, h-header-scrolled, max-w-container
- TheFooter: max-w-container, px-container
- SectionRenderer (no changes needed)

**Admin pages (15 files):**
- All admin pages: max-w-content
- Admin layout: pt-section → keep p-6/p-10 (different context)

**Routes (5 files):**
- blog, blog/[slug], portfolio, portfolio/[slug], legal/[slug]: max-w-container, max-w-prose

## VERIFICATION
- `npm run check` → 0 errors
- `grep -r "text-\[" src/lib/components/ src/routes/` → 0 matches (except intentional ones like `text-[9px]`)
- `grep -r "max-w-\[" src/lib/components/ src/routes/` → 0 matches (except `max-w-[300px]` for truncation)
