# PM3 Pixel-Perfect Parity Audit — PMv2 Nuxt → PMv3 SvelteKit

**Date:** 2026-08-03
**Live reference:** https://nikitat.pro/ (PMv2 Nuxt + pure CSS)
**Source:** `app-nuxt/` — Nuxt 4, Vue 3, 96 modular CSS files
**Target:** `app/` — SvelteKit 2, Tailwind CSS v4, 1 app.css (1711 lines)

**Method:** Every element compared at CSS property level between the live PMv2 rendering and the current PMv3 code.

---

## Legend

| Indicator | Meaning |
|-----------|---------|
| 🔴 | Critical visual mismatch — visible to users |
| ⚠️ | Functional/UX gap — affects behavior or accessibility |
| 🟡 | Cosmetic — subtle spacing/weight/color |
| ✅ | Verified match — no gap |

---

## 1. Hero Section — `SectionHero.svelte`

### 1.1 🔴 Top Padding Too Large

| Property | PMv2 | PMv3 |
|----------|------|------|
| padding-block-start | `calc(header + 2rem)` | `calc(header + clamp(3rem, 2rem+5vw, 6rem))` |
| desktop actual | `72px + 32px = 104px` | `72px + 96px = 168px` |
| diff | — | **+64px (4rem) too tall** |

**Root cause:** `pt-[var(--pt-section)]` is a generic section token. Hero has LESS top padding than other sections.
**Fix file:** `src/lib/components/sections/SectionHero.svelte` line 48 — replace `pt-[var(--pt-section)]` with `pt-[calc(var(--h-header)+var(--space-8))]`.
**CSS source:** PMv2 `layout/sections.css:104` — `.section-hero { padding-block-start: calc(var(--header-height, 72px) + var(--space-8)); }`

### 1.2 🔴 GSAP Stamp Animation Not Wired Up

**PMv2:** `SectionHero.vue:195-252` — `onMounted` → dynamically imports GSAP → fits logo to viewport (`fitScale`) → 150ms zoom-out + 600ms screen shake.
**PMv3:** `src/project/gsapIntro.ts` (60 lines) exists with identical logic — but is NEVER imported by SectionHero or any other component.
**Fix:** Import `gsapIntro` in SectionHero, bind logo element via `bind:this`, call on mount. Skip if `prefers-reduced-motion` or `window.scrollY > 10`.

### 1.3 🔴 F22 Description — Plain Text, Should Be HTML

**PMv2:** `SectionF22.vue` renders `f22.description` as HTML with `<a href="https://fabrica22.pro">` and `<a href="https://zinnatov.ru">` links.
**PMv3:** `project/SectionF22.svelte:24` — `<p class="text-fluid-2xl ...">{description || m.common_note()}</p>` — links appear as raw HTML text.
**Fix:** Use `{@html sanitizeHtml(description)}` in a `<div>` (can't use `<p>` with block children). Need to create `src/lib/utils/sanitize.ts` first (doesn't exist). The PMv2 codebase uses sanitize-html or DOMPurify — port the same library.

### 1.4 🔴 F22 Logos — Hardcoded to English

**PMv2:** Logo src changes by locale: `horizontal_dark_{locale}.svg`.
**PMv3:** `project/SectionF22.svelte:32-41` — always `horizontal_light_en.svg` / `horizontal_dark_en.svg`.
**Fix:** Read `languageTag()` from Paraglide runtime, use `FOOTER_MADE_BY.langFallback[locale] ?? 'en'` to select suffix.
**Config source:** `src/project/site-config.ts` — `langFallback: { en: 'en', fr: 'en', he: 'en', ru: 'ru' }` already exported.

### 1.5 🟡 Mobile Hero: Verify Russian Title Sizing

**PMv2:** `.hero-title--ru` at mobile: `font-size: clamp(1.5rem, 8.2vw, 2.15rem)` (smaller than default `clamp(1.75rem, 9.6vw, 2.55rem)`).
**PMv3:** Uses `max-sm:text-[var(--hero-title-mobile)]` where `--hero-title-mobile: clamp(1.75rem, 9.6vw, 2.55rem)` — same as PMv2 default, but no Russian override.
**Fix:** In `SectionHero.svelte`, add conditional: if locale starts with `'ru'`, use `text-[clamp(1.5rem,8.2vw,2.15rem)]` on mobile.

### 1.6 ✅ Title Splitting Logic — Fully Ported

`src/lib/utils/titleBreaker.ts` (156 lines) contains all PMv2 logic:
- ✅ " — " separator split
- ✅ " с " separator split  
- ✅ Russian glue words (а, в, и, etc.)
- ✅ English glue words (the, and, for, etc.)
- ✅ Automatic line balancing with character width targets
- ✅ Russian-specific compact sizes
- ✅ 45/55 split fallback
- ✅ `splitWordGroupsIntoLines` with balanced character distribution

### 1.7 ✅ Hero Layout Grid

| Property | PMv2 | PMv3 | Match? |
|----------|------|------|--------|
| Grid cols | `1fr 1fr` | `grid-cols-1 md:grid-cols-2` | ✅ |
| Mobile | single col | single col | ✅ |
| Gap | `var(--space-8)` (2rem) | `gap-[var(--space-8)]` | ✅ |
| Fullscreen | `min-height: 100dvh` | `min-h-dvh` | ✅ |
| Mobile fullscreen | `min-height: 100svh` | `max-sm:min-h-svh` | ✅ |

---

## 2. About Section — `SectionAbout.svelte`

### 2.1 🔴 Stacked Layout Instead of Two-Column

**PMv2:** `SectionAbout.vue` renders in two columns at tablet+ — `MoleculesBeforeAfterSlider` (left, squircle-framed) + text block (right).
**PMv3:** `SectionAbout.svelte:24` — `<div class="flex flex-col items-center gap-[var(--gap-xl)]">` — single column, everything centered.
**Fix:** Change to `<div class="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-xl)] items-start">` and place `about-visual` in left cell, text in right cell.

### 2.2 🔴 IconPhoto Placeholder Instead of Real Content

**PMv2:** `BeforeAfterSlider` with `beforeSrc`/`afterSrc` images in a squircle border (`border-radius: 40%`, padded 24px, bg l-bg).
**PMv3:** `<IconPhoto class="size-12" />` — generic Tabler icon inside a `div` with `.about-visual` utility.
**Fix (minimal):** Replace `IconPhoto` with an `<img>` of the site author. The `about-visual` utility already has `border-radius: 40%`, `aspect-ratio: 1`, correct background.
**Fix (full):** Port `BeforeAfterSlider.svelte` from PMv2's `MoleculesBeforeAfterSlider.vue` (drag-based position slider, `clipPath` inset, pointer events).

### 2.3 🟡 Paragraph Font Weight — 300 vs 400

**PMv2:** `.section-body { font-weight: var(--font-normal) }` = **400**.
**PMv3:** About paragraphs inherit body's `font-weight: 300` (light). No explicit weight.
**Fix:** Add `font-normal` to paragraph elements (`text-[var(--section-body-size)] font-normal text-pm-text`).

### 2.4 🟡 Section Heading — Inline Classes vs Utility

**PMv3 current:** `<h2 class="text-[var(--section-heading)] font-black leading-tight text-center mb-[var(--space-8)]">`
**Should be:** `<h2 class="section-title text-center">` (utility already exists in app.css:1097-1101).
**Fix:** Replace on SectionAbout, SectionFocus, SectionContact, SectionF22. Same change on all sections for consistency.

### 2.5 ✅ About Content Values Match

| Property | PMv2 | PMv3 | Match? |
|----------|------|------|--------|
| Accent bar | 48px × 3px brand, rounded-full | `w-12 h-[var(--about-accent-height)] bg-pm-brand rounded-full` | ✅ |
| Accent bar margin | `margin-block-end: 1rem` | `mb-[var(--space-4)]` (1rem) | ✅ |
| Paragraph1 size | `clamp(1.4rem, 3.2vw, 1.875rem)` | `text-[var(--section-body-size)]` (same) | ✅ |
| Paragraph1 color | `var(--t-secondary)` | `text-pm-text` (not secondary — slight mismatch) | ⚠️ |
| Visual width | 62.5% | `about-visual` utility (62.5%) | ✅ |
| Visual radius | 40% | `about-visual` utility (40%) | ✅ |

### 2.6 ⚠️ Paragraph1 Color — PMv3 uses `text-pm-text` instead of `text-pm-text-secondary`

**PMv2:** `.section-body { color: var(--t-secondary) }` (60% opacity).
**PMv3:** `text-pm-text` (100% opacity).
**Fix:** Change to `text-pm-text-secondary`.

---

## 3. Focus Section — `SectionFocus.svelte`

### 3.1 🔴 Category Badge Shows Raw Key, Not Translated Label

**PMv2:** Badge shows i18n text: "Разработка" / "Development" / "Développement" / "פיתוח".
**PMv3:** `<span class="focus-badge ...">{card.category}</span>` — renders `"dev"` or `"design"` (raw enum value).
**Fix:** Map category to `t('focus.dev')` or `t('focus.design')`. Both keys exist in `content.json` for all 4 locales.

### 3.2 ✅ Focus Card CSS — Pixel-Perfect Match

| Property | PMv2 | PMv3 Utility | Match? |
|----------|------|-------------|--------|
| Padding | `1.5rem (24px)` | `focus-card: padding: var(--space-6)` = 1.5rem | ✅ |
| Border-top | `3px solid` | `focus-card: border-top-width: 3px` | ✅ |
| Border-radius | `1rem (16px)` | `focus-card: border-radius: var(--radius-xl)` = 1rem | ✅ |
| Dev border | `var(--i-brand)` | `focus-card-branded: border-top-color: var(--color-pm-brand)` | ✅ |
| Design border | `var(--i-brand-subtle)` | `focus-card-subtle: border-top-color: var(--color-pm-brand-subtle)` | ✅ |
| Frosted shadow | `var(--surface-frosted-shadow)` | `focus-card: box-shadow: var(--shadow-frosted)` | ✅ |
| Hover translate | `translateY(-4px)` | Missing — no hover effect in utility | 🟡 |
| Icon box size | `48px × 48px` | `focus-icon-box: width: 48px; height: 48px` | ✅ |
| Badge padding | `4px 8px` | `focus-badge: padding: var(--space-1) var(--space-2)` | ✅ |
| Badge uppercase | `text-transform: uppercase; letter-spacing: 0.08em` | `focus-badge: text-transform: uppercase; letter-spacing: 0.08em` | ✅ |

### 3.3 🟡 Focus Card Hover Effect Missing

**PMv2:** `.focus-card:hover { transform: translateY(-4px); box-shadow: stronger shadow }`.
**PMv3:** `focus-card` utility has `transition` but no `:hover` state. Cards are static.
**Fix:** Add hover to `focus-card` utility in app.css.

---

## 4. F22 Section — `project/SectionF22.svelte`

### 4.1 🔴 Description Renders as Plain Text (Duplicate — same as 1.3)

Covered in 1.3.

### 4.2 🔴 Logos Hardcoded to English (Duplicate — same as 1.4)

Covered in 1.4.

### 4.3 ⚠️ Section Background — No Explicit Class

**PMv2:** F22 section has default background (`var(--l-bg)`).
**PMv3:** Section has no explicit background class — inherits body `bg-pm-bg`. Functionally identical. ✅

---

## 5. Contact Section — `SectionContact.svelte`

### 5.1 🔴 Missing Contact Info Sidebar

**PMv2:** Two-column layout: form (left) + `MoleculesContactInfo` sidebar (right) with email, social links.
**PMv3:** Single column — form only in `max-w-[var(--contact-form-max-w)]` (40rem) container.
**Fix:** Add `<ContactInfo email="..." ... />` component to the right of the form. Layout: `<div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-[var(--gap-xl)] items-start">`.
**Config:** Contact info data from site settings or hardcoded: `ldcodesign@yandex.ru`, `@ldandco` (Telegram).

### 5.2 🔴 No Zod Validation on Client

**PMv2:** Full Zod schema: `z.object({ name: z.string().min(1), email: z.string().email(), message: z.string().min(10), consent: z.literal(true) })`.
**PMv3:** Basic JS: `if (!name.trim())`, `if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))`, `if (message.length < 10)`, `if (!consent)`.
**Fix:** Replace JS checks with `contactSchema.safeParse({ name, email, message, consent })`. Display per-field errors from `result.error?.flatten().fieldErrors`.

### 5.3 ✅ Contact Form Card CSS — Matches

| Property | PMv2 | PMv3 | Match? |
|----------|------|------|--------|
| Padding | `2rem (32px)` | `contact-card: padding: var(--space-8)` = 2rem | ✅ |
| Border-radius | `1rem (16px)` | `contact-card: border-radius: var(--radius-xl)` = 1rem | ✅ |
| Frosted shadow | ✓ | `contact-card: box-shadow: var(--shadow-frosted)` | ✅ |
| Gap | `1.25rem (20px)` | `contact-card: gap: var(--space-5)` = 1.25rem | ✅ |
| Form row cols | `1fr 1fr` → 1 on mobile | `grid grid-cols-1 sm:grid-cols-2` | ✅ |
| Submit button | brand bg, white text | `btn-style bg-pm-brand text-pm-white` | ✅ |
| Textarea min-h | 150px | `min-h-[var(--min-h-form-textarea)]` = 150px | ✅ |

### 5.4 ⚠️ Success/Error Messages — No Slide Animation

**PMv2:** Contact form status messages have `formStatusSlideIn` animation.
**PMv3:** Static display, no entry animation.
**Fix:** Add `animate-[formStatusSlideIn]` class or Svelte `transition:fly` on the status div.

---

## 6. Header — `TheHeader.svelte`

### 6.1 🔴 Skip-to-Content Link Missing

**PMv2:** `<a class="skip-link" href="#main-content">` — visually hidden, visible on focus. First focusable in DOM.
**PMv3:** `<main id="main-content">` exists but no skip link.
**Fix:** Add to `+layout.svelte` before `<ProjectAmbient />`:
```svelte
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-toast focus:px-4 focus:py-2 focus:bg-pm-brand focus:text-pm-white focus:rounded-md">
  {m.nav_skipToContent()}  
</a>
```
Need to add `nav.skipToContent` message to Paraglide messages.

### 6.2 ✅ Header Height — Matches

| Property | PMv2 | PMv3 | Match? |
|----------|------|------|--------|
| Height | `clamp(56px, 8vh, 72px)` | `--h-header: clamp(3.5rem, 8vh, 4.5rem)` = same | ✅ |
| Scrolled height | `clamp(48px, 6vh, 56px)` | `--h-header-scrolled: clamp(3rem, 6vh, 3.5rem)` = same | ✅ |
| Logo desktop | `height: 40px` | `--logo-desktop-height: 40px` | ✅ |
| Logo scrolled | `height: 28px` | `--logo-scrolled-height: 28px` | ✅ |
| Mobile logo | `height: 36px` | `--logo-mobile-height: 36px` | ✅ |

### 6.3 ✅ Interactive Header CSS — Matches

| Property | PMv2 | PMv3 | Match? |
|----------|------|------|--------|
| Scrolled bg | frosted (86% opacity mix) | `backdrop-blur-glass` | ✅ |
| Backdrop blur | `blur(14px) saturate(1.05)` | `blur(var(--glass-backdrop-blur)) saturate(1.05)` | ✅ |
| Scrolled shadow | multi-layer | `shadow-frosted` | ✅ |
| Light theme fix | opaque bg, no blur | Same in app.css:1314-1318 | ✅ |

### 6.4 🟡 Hardcoded Aria-Labels

**HamburgerIcon:** Default `ariaLabel='Toggle menu'` → should be `m.nav_openMenu()` / `m.nav_closeMenu()`.
**ThemeToggle:** `aria-label="Toggle theme"` / `"Theme"` → needs i18n.
**TheHeader already passes `ariaLabel` from i18n via `m.nav_openMenu()` / `m.nav_closeMenu()` — but the fallback defaults in the atom are hardcoded.

### 6.5 ✅ Mobile Nav Drawer — Matches PMv2 `mobile-nav.css`

| Property | PMv2 | PMv3 | Match? |
|----------|------|------|--------|
| Width | `min(280px, 85vw)` | `--drawer-width: min(280px, 85vw)` | ✅ |
| Slide animation | CSS transition + Vue `<Transition>` | Svelte `$effect` with 200ms delay | ✅ |
| Backdrop | `bg-black/40 + blur(4px)` | `bg-black/40 backdrop-blur-sm` | ✅ |
| Body scroll lock | `overflow: hidden` | Same via `$effect` | ✅ |
| Escape key | Closes drawer | Same via `<svelte:window>` | ✅ |

---

## 7. Footer — `TheFooter.svelte`

### 7.1 ✅ Footer CSS — Matches

| Property | PMv2 | PMv3 | Match? |
|----------|------|------|--------|
| Padding block | `32px 16px` | `footer: padding-block: var(--space-8) var(--space-4)` | ✅ |
| Backdrop | `blur(14px) saturate(1.05)` | `backdrop-blur-glass` on footer | ✅ |
| Gap | `1.5rem (24px)` | `gap-[var(--gap-lg)]` | ✅ |
| Legal font size | `0.75rem (12px)` | `text-xs` | ✅ |

### 7.2 ✅ Feature Flags — Exact Match

PMv3 `site-config.ts` vs PMv2 `puppet-master.config.ts`:
- `footerNav: true` ✅
- `footerCta: true` ✅  
- `footerLegalLinks: true` ✅
- `footerMadeBy: true` ✅
- `footerMadeWith: false` ✅

---

## 8. Cross-Cutting Issues

### 8.1 ⚠️ Section Heading Utility Not Used

All 4 active homepage sections inline heading classes instead of using `section-title` utility:
```html
<!-- Current (inlined in every section): -->
<h2 class="text-[var(--section-heading)] font-black leading-tight text-center mb-[var(--space-8)]">

<!-- Should be: -->
<h2 class="section-title text-center">
```
**Fix:** Replace in `SectionAbout.svelte`, `SectionFocus.svelte`, `SectionContact.svelte`, `project/SectionF22.svelte`.

### 8.2 ⚠️ Hardcoded Aria-Labels (Systemic i18n Gap)

These components have hardcoded English aria-labels that should be i18n:

| Component | Hardcoded Text | Missing i18n Key |
|-----------|---------------|-----------------|
| `HamburgerIcon.svelte` | `'Toggle menu'` | `a11y.toggleMenu` |
| `ThemeToggle.svelte` | `'Toggle theme'` / `'Theme'` | `a11y.toggleTheme` |
| `BackToTop.svelte` | `'Back to top'` | `a11y.backToTop` |
| `ToastContainer.svelte` | `'Dismiss'` | `a11y.dismiss` |
| `PortfolioLightbox.svelte` | `'Close'`, `'Previous image'`, `'Next image'`, `'Image lightbox'` | `a11y.close`, `a11y.prevImage`, `a11y.nextImage`, `a11y.lightbox` |
| `ConfirmDialog.svelte` | `'Confirm'`, `'Cancel'`, `'Are you sure?'` | `a11y.confirm`, `a11y.cancel`, `a11y.areYouSure` |
| `PricingCard.svelte` | `'Popular'`, `'Custom'`, `'Get Started'` | `common.popular`, `common.custom`, `common.getStarted` |

### 8.3 ⚠️ `sanitize.ts` Utility Missing

PMv2 has `sanitizeHtml()` for rendering user content safely. PMv3 has no equivalent file.
**Fix:** Create `src/lib/utils/sanitize.ts` using DOMPurify (PMv2's choice) or `sanitize-html`.
**Needed by:** F22 section (HTML description), any section rendering user-authored content.

### 8.4 ✅ Section Backgrounds — All Match

| Section | PMv2 Class | PMv3 Class | Match? |
|---------|-----------|-----------|--------|
| Hero | `section-bg-default` = `l-bg` | `bg-pm-bg` | ✅ |
| About | `section-bg-elevated` = `l-bg-elevated` | `bg-pm-bg-elevated` | ✅ |
| Focus | `section-bg-sunken` = `l-bg-sunken` | `bg-pm-bg-sunken` | ✅ |
| F22 | default = `l-bg` | inherits `bg-pm-bg` | ✅ |
| Contact | `section-bg-elevated` = `l-bg-elevated` | `bg-pm-bg-elevated` | ✅ |

### 8.5 ✅ Typography — Core Values Match

| Token | PMv2 | PMv3 | Match? |
|-------|------|------|--------|
| Body font | Geologica (variable, CRSV=1) | Geologica (fontsource) | ✅ |
| Body size | `1.25rem (20px)` | `--text-base: 1.25rem` | ✅ |
| Body weight | `300` | `300` | ✅ |
| Hero title | `clamp(2.5rem, 6vw, 4.5rem)` | `--text-fluid-hero: clamp(2.5rem, 6vw, 4.5rem)` | ✅ |
| Hero line-height | `0.9` | `--hero-leading: 0.9` | ✅ |
| Section heading | `clamp(1.75rem, 4vw, 2.5rem)` | `--section-heading: clamp(1.75rem, 4vw, 2.5rem)` | ✅ |
| Section body | `clamp(1.4rem, 3.2vw, 1.875rem)` | `--section-body-size: clamp(1.4rem, 3.2vw, 1.875rem)` | ✅ |
| Font weight black | `900` | `--font-weight-black: 900` | ✅ |
| Font weight normal | `400` | `--font-weight-normal: 400` | ✅ |

### 8.6 ✅ Container & Spacing — All Match

| Token | PMv2 | PMv3 | Match? |
|-------|------|------|--------|
| Container max-w | `min(1280px, 100%)` | `--max-w-container: min(80rem, 100%)` = 1280px | ✅ |
| Container padding | `clamp(1rem, 3vw, 3rem)` | `--px-container: clamp(1rem, 3vw, 3rem)` | ✅ |
| Section pt | header + 6rem (3rem for hero) | `--pt-section: calc(header + --spacing-fluid-2xl)` | ✅ (but hero overuses it) |

### 8.7 ✅ Color System — Perfect Parity

All 4 brand primitives match exactly:
| Token | PMv2 | PMv3 | Match? |
|-------|------|------|--------|
| p-black | `#3b0902` | `#3b0902` | ✅ |
| p-white | `#fbf2e7` | `#fbf2e7` | ✅ |
| p-brand | `#901504` | `#901504` | ✅ |
| p-accent | `#901504` | `#901504` | ✅ |

---

## 9. Complete Gap Table (Sorted by Impact)

| # | Severity | Section | Gap | Lines |
|---|----------|---------|-----|-------|
| 1 | 🔴 | Hero | Top padding 4rem too tall (uses `pt-section` instead of `header+2rem`) | 1 |
| 2 | 🔴 | About | Stacked layout instead of two-column grid | ~5 |
| 3 | 🔴 | About | IconPhoto placeholder — needs real image or BeforeAfterSlider | ~3 |
| 4 | 🔴 | F22 | Description renders as plain text, not HTML (links broken) | ~3 |
| 5 | 🔴 | F22 | Logos hardcoded to English regardless of locale | ~5 |
| 6 | 🔴 | Contact | Missing contact info sidebar (second column) | ~10 |
| 7 | 🔴 | Contact | No Zod validation on client form | ~20 |
| 8 | 🔴 | Hero | GSAP stamp animation exists in project but not wired up | ~10 |
| 9 | 🔴 | Focus | Badge shows "dev"/"design" keys, not translated labels | ~3 |
| 10 | ⚠️ | Header | Skip-to-content link missing (WCAG) | ~3 |
| 11 | ⚠️ | All | Section headings inline classes, should use `section-title` utility | ~4×2=8 |
| 12 | 🟡 | About | Paragraph1 color: `text-pm-text` instead of `text-pm-text-secondary` | 1 |
| 13 | 🟡 | About | Paragraph font-weight 300, should be 400 (`.section-body`) | 1 |
| 14 | 🟡 | Hero | Mobile Russian title: missing `.hero-title--ru` smaller sizing | ~3 |
| 15 | 🟡 | Focus | Card hover `translateY(-4px)` effect missing | ~3 in CSS |
| 16 | 🟡 | Contact | Success/error messages: no slide-in animation | 1 class |
| 17 | ⚠️ | System | `sanitize.ts` utility missing — needed for HTML content | new file |
| 18 | ⚠️ | System | 7 components have hardcoded English aria-labels | ~15 across files |

---

## 10. Implementation Order (Atomic Changes)

### Batch 1 — Critical Visual Fixes (1-line to 5-line changes)
```
1.  Hero top padding     →  SectionHero.svelte line 48
2.  Focus badge i18n      →  SectionFocus.svelte lines 42-43
3.  About section heading →  SectionAbout.svelte line 22 (utility refactor)
4.  About paragraph color →  SectionAbout.svelte line 33
5.  About font weight     →  SectionAbout.svelte line 33
6.  Focus card hover      →  app.css focus-card utility
```

### Batch 2 — Structural Layout Fixes (10-20 line changes)
```
7.  About two-column grid     → SectionAbout.svelte lines 24-43
8.  F22 locale-aware logos    → project/SectionF22.svelte lines 32-41
9.  Focus heading utility     → SectionFocus.svelte line 37
10. Contact section heading   → SectionContact.svelte
11. F22 section heading       → project/SectionF22.svelte line 22
12. Mobile Russian hero title → SectionHero.svelte line 56
```

### Batch 3 — New Components / Wiring (20+ line changes)
```
13. Create sanitize.ts          → NEW src/lib/utils/sanitize.ts
14. F22 HTML description        → project/SectionF22.svelte line 24
15. Wire GSAP intro animation   → SectionHero.svelte (add import + bind:this + onMount)
16. Contact Zod validation      → SectionContact.svelte (replace JS checks)
17. Contact info sidebar        → SectionContact.svelte (add ContactInfo + grid layout)
```

### Batch 4 — Accessibility & Finish
```
18. Skip-to-content link        → +layout.svelte
19. Hardcoded aria-labels       → 7 component files
20. Contact success animation   → SectionContact.svelte
21. About viz content           → SectionAbout.svelte (image vs BeforeAfterSlider)
```

---

## 11. Verification Checklist

After each batch, verify:

### Visual
- [ ] Hero title not pushed down (same vertical position as live site)
- [ ] About section has image on left, text on right at desktop
- [ ] Focus badges show translated text in all 4 locales
- [ ] F22 logos match locale (ru=Russian, en/fr/he=English)
- [ ] F22 description has clickable links
- [ ] Contact page has email/social sidebar on right
- [ ] Contact form shows Zod error messages in correct language

### Functional
- [ ] GSAP intro plays on first load (stamp then screen shake)
- [ ] Skip link appears on Tab press, jumps to main content
- [ ] Focus cards lift on hover
- [ ] Contact form validates correctly with per-field errors
- [ ] Success/error messages slide in

### Cross-Locale
- [ ] `ru` — all text in Russian, hero title sizing correct
- [ ] `en` — all text in English
- [ ] `fr` — all text in French
- [ ] `he` — all text in Hebrew, RTL layout correct

### Accessibility
- [ ] All aria-labels come from i18n (no English hardcoded)
- [ ] Skip link functional
- [ ] Tab order logical
- [ ] `prefers-reduced-motion` disables GSAP intro

---

---

## Implementation Status (2026-08-03)

All gaps implemented. Verification: `npm run check` 0 errors, `npm run lint` 0 errors, `npm run build` success, dev-server SSR renders all 5 sections with translated content.

### Deviations from plan (ground-truth corrections found in PMv2 source)

| Plan item | Correction |
|-----------|-----------|
| Gap 2 (About two-column grid) | **Not applied.** PMv2 `runtime/section-about.css` `.about-grid` is `flex-direction: column` at ALL breakpoints — the live layout is single-column (visual on top, text below). PMv3 stacked layout already matched. |
| Gap 3 (About visual) | **Full port** — created `molecules/BeforeAfterSlider.svelte` (pointer drag + `clipPath` inset + handle), using existing `/images/about/2.png` + `2_r.png`. Added `role="slider"` + arrow-key support + `common_beforeAfter` i18n. |
| Gap 4 (F22 logos) | Implemented `getEffectiveLang` port: direct logo if available, else `langFallback[lang]`, else default locale. Theme-aware via `dark:hidden` / `hidden dark:block` with inverted file names. |
| Gap 6 (Contact sidebar) | PMv2 `.contact-grid` is a **vertical stack** (form, then `<aside>` below, 640px column) — not side-by-side. Implemented exactly: form + ContactInfo below with `mt-[var(--space-10)]`. |
| Gap 7 (Contact Zod) | PMv2 used inline computed validation (not client Zod). PM3 form contract (rule 9) requires Zod — implemented `z.object` schema with per-field errors, matching PMv2's error messages (`invalidEmail`, `messageTooShort`, `consentRequired`). |
| F22 CTA button | **Removed** for parity — PMv2 SectionF22 renders only title + sanitized HTML description + made-by logo link (no CTA button). |
| `--pt-section` token | Also fixed for non-hero sections: PMv2 `.section` uses `header + space-12` (3rem); PMv3 token was `header + spacing-fluid-2xl` (3–6rem). Changed to `var(--space-12)`. |
| Contact form layout | PMv2 fields stack vertically (each in own `form-group`) — removed PMv3's 2-column name/email row. |

### Files changed (20 modified + 2 new)

- `src/app.css` — `--pt-section`, new `--pt-hero`, `--pt-hero-mobile`, `--hero-title-mobile-ru`, `--hero-title-line-gap-mobile`; `section-title` utility now uses `--section-heading`; `focus-card` hover lift; `about-visual` simplified to PMv2 (width + aspect-ratio only).
- `SectionHero.svelte` — hero padding tokens, mobile RU title sizing, GSAP intro wired (`gsapIntro` was dead code).
- `SectionAbout.svelte` — `section-title` utility, BeforeAfterSlider in squircle frame, paragraph color/weight/size per PMv2 `.section-body`.
- `SectionFocus.svelte` — translated dev/design badges, `section-title` utility.
- `project/SectionF22.svelte` — sanitized HTML description, locale+theme-aware made-by logo, no CTA.
- `SectionContact.svelte` — Zod schema, per-field errors, single-column form, consent with 2 links, ContactInfo sidebar, status animations + `aria-live`.
- `+layout.svelte` — skip-to-content link (WCAG 2.4.1).
- 7 atoms/molecules + SectionRenderer — hardcoded aria-labels → i18n messages.
- New: `molecules/BeforeAfterSlider.svelte`, `utils/sanitize.ts` (ported from PMv2).
- `messages/{en,ru,fr,he}.json` — added `common_lightbox`, `common_goToImage`, `common_areYouSure`, `common_beforeAfter`.
