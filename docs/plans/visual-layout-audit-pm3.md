# PM3 Visual Layout Audit — PMv2 vs PMv3 Side-by-Side

**Date:** 2026-08-03
**Live reference:** https://nikitat.pro/
**PMv2 source:** `app-nuxt/` (Nuxt + pure CSS)
**PMv3 target:** `app/` (SvelteKit + Tailwind CSS v4)

**Goal:** Make the PMv3 SvelteKit site render IDENTICAL to the live PMv2 Nuxt site, but using Tailwind utilities and PMv3 design tokens (NOT pure CSS BEM classes).

---

## Gap Severity Legend

| Severity | Meaning |
|----------|---------|
| 🔴 Critical | Major visual layout mismatch — user sees wrong structure |
| ⚠️ Medium | Functional/behavioral difference — affects UX |
| 🟡 Low | Minor cosmetic difference in spacing/weight/color |

---

## Gap 1 🔴 — Hero Section: Excessive Top Padding

**PMv2 behavior:**
```css
.section-hero {
  padding-block-start: calc(var(--header-height, 72px) + var(--space-8)); /* header + 2rem */
}
```

**PMv3 current code** (SectionHero.svelte line 48):
```html
<section class="... pt-[var(--pt-section)] ...">
```
Where `--pt-section = calc(var(--h-header) + var(--spacing-fluid-2xl))`
And `--spacing-fluid-2xl = clamp(3rem, 2rem + 5vw, 6rem)`

**Result:** On desktop, hero has `header + 6rem` top padding instead of `header + 2rem`. The hero title is pushed ~4rem lower than on the live site.

**Fix:** Replace `pt-[var(--pt-section)]` with `pt-[calc(var(--h-header)+var(--space-8))]` on SectionHero ONLY. The `--pt-section` token is correct for other sections — only the hero has less top padding.

---

## Gap 2 🔴 — About Section: Stacked Layout Instead of Two-Column

**PMv2 layout:**
```
[BeforeAfterSlider (left, ~half width)] + [Two paragraphs (right, ~half width)]
```
Two-column grid at tablet+ (`@media (--tablet) { grid-template-columns: 1fr 1fr }`).

**PMv3 current code** (SectionAbout.svelte line 24):
```html
<div class="flex flex-col items-center gap-[var(--gap-xl)]">
```
Everything is stacked vertically. No grid at any breakpoint.

**Fix:** Change the layout div to:
```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-xl)] items-center">
```
And place the `about-visual` div on the left, text on the right. The `about-visual` currently uses `62.5%` width — that becomes the natural width within its grid cell.

---

## Gap 3 🔴 — About Section: Placeholder Icon Instead of Content

**PMv2:** Uses `MoleculesBeforeAfterSlider` — an interactive before/after image comparison component inside a squircle border (`border-radius: 40%`).

**PMv3 current code** (SectionAbout.svelte lines 25-27):
```html
<div class="about-visual">
  <IconPhoto class="size-12" />
</div>
```
Generic photo icon placeholder. No images, no interaction.

**Fix options:**
- **Option A (full parity):** Port `BeforeAfterSlider` component and load actual before/after images from project assets
- **Option B (simpler):** Replace `IconPhoto` with a static image (photo of Nikita) inside the squircle frame
- **Option C (keep minimal):** Style the placeholder better — use a brand-colored illustration or pattern instead of a generic icon

**Recommended:** Option B for now — static image in the squircle. The BeforeAfterSlider can be ported later if the images exist.

---

## Gap 4 🔴 — F22 Section: Hardcoded English Logo Filenames

**PMv2:** Logos switch by locale. Config defines 8 variants: `{horizontal,circle} × {light,dark} × {en,ru}`. Selection logic picks locale-appropriate logo.

**PMv3 current code** (project/SectionF22.svelte lines 31-41):
```html
<picture>
  <source srcset="{logoBase}/horizontal_light_en.svg" media="(prefers-color-scheme: dark)" />
  <img src="{logoBase}/horizontal_dark_en.svg" ... />
</picture>
```
Always uses `_en` regardless of locale. French and Hebrew visitors see English logos.

**Fix:** Read locale from `languageTag()`, map it to a logo lang suffix. `FOOTER_MADE_BY.langFallback` in config provides the mapping:
```ts
// site-config.ts already exports this:
langFallback: { en: 'en', fr: 'en', he: 'en', ru: 'ru' }
```
Use `langFallback[locale] ?? 'en'` to select `horizontal_light_{lang}.svg`.

---

## Gap 5 🔴 — F22 Section: Description Renders as Plain Text, Not HTML

**PMv2:** F22 description contains HTML `<a>` links to `https://fabrica22.pro` and `https://zinnatov.ru`. Rendered with `sanitizeHtml()`.

**PMv3 current code** (project/SectionF22.svelte line 24):
```html
<p class="text-fluid-2xl ...">{description || m.common_note()}</p>
```
Plain `<p>` tag. HTML links are displayed as raw text, not rendered.

**Fix:** Use `{@html sanitizeHtml(description)}` instead of `{description}`. The project already has `sanitizeHtml` available from `$lib/utils/sanitize`. Must use a `<div>` instead of `<p>` since `<p>` can't contain block elements.

---

## Gap 6 🔴 — Contact Section: Missing Contact Info Sidebar

**PMv2:** Two-column layout — form (left, `max-width: 40rem`) + contact info sidebar (right) with email, social links, location icons.

**PMv3 current code** (SectionContact.svelte): Single-column form only.

**Fix:** Add `MoleculesContactInfo` component showing email, telegram, and other social links from settings (or hardcode: `ldcodesign@yandex.ru`, `@ldandco`). Layout becomes:
```html
<div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-[var(--gap-xl)]">
  <!-- Form col -->
  <!-- Contact info col -->
</div>
```

---

## Gap 7 ⚠️ — Contact Section: No Zod Validation on Client

**PMv2:** Full Zod schema validation: email format, message ≥10 chars, consent checkbox.

**PMv3 current code** (SectionContact.svelte): Basic JS checks — only checks `name`, `email`, `message` truthiness + email format regex + consent. No structured validation errors.

**Fix:** Create a Zod schema matching PMv2's contact form schema:
```ts
const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
  consent: z.literal(true, { errorMap: () => ({ message: t('contact.consentRequired') }) })
})
```
Use `safeParse()` and display per-field errors inline (PM3 form contract rule 9).

---

## Gap 8 ⚠️ — Hero Logo: No GSAP Stamp Animation

**PMv2:** On page load, hero logo plays a GSAP timeline:
1. Logo scales from ~4× to 1× (stamp-down effect, 150ms, `power4.in`)
2. Screen shake (decaying oscillations over 600ms)

**PMv3:** Logo renders statically via `<Logo shape="circle" />`. A `gsapIntro.ts` file exists at `src/project/gsapIntro.ts` but is never imported.

**Fix:** Import and trigger `gsapIntro` in SectionHero's `onMount`. The existing `gsapIntro.ts` uses the same `gsap.fromTo()` + shake pattern as PMv2. Needs:
- Logo `bind:this={logoEl}` ref
- Call `gsapIntro(logoEl, mainEl)` on mount
- Skip if `prefers-reduced-motion` or `window.scrollY > 10`
- Skip in admin routes

---

## Gap 9 ⚠️ — Skip-to-Content Link Missing (WCAG Fail)

**PMv2:** `<a class="skip-link" href="#main-content">` — visually hidden, visible on focus. First focusable element.

**PMv3:** `+layout.svelte` has `<main id="main-content">` but no skip link.

**Fix:** Add to `+layout.svelte` before `<ProjectAmbient />`:
```html
<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-toast focus:px-4 focus:py-2 focus:bg-pm-brand focus:text-pm-white focus:rounded-md">
  {m.nav_skipToContent()}
</a>
```
Requires adding i18n key `nav.skipToContent` with values: `"Перейти к содержимому"` (ru), `"Skip to content"` (en), etc.

---

## Gap 10 🟡 — Focus Cards: Category Badge Shows Raw Key, Not Translated Label

**PMv2:** Focus cards show translated badge text: "Разработка" / "Development" / "Développement" / "פיתוח".

**PMv3 current code** (SectionFocus.svelte lines 42-43):
```html
<span class="...">{card.category}</span>
```
`card.category` is `'dev'` or `'design'` — the raw key string.

**Fix:** Map category to translated label:
```ts
const categoryLabel = $derived(card.category === 'dev' ? t('focus.dev', m.common_development()) : t('focus.design', m.common_design()))
```
Both translations exist in `content.json`. Need to add Paraglide messages for `common_development` and `common_design` if they don't exist.

---

## Gap 11 🟡 — Section Headings: Inconsistent Utility Usage

**PMv2:** All section titles use `.section-title` class consistently:
```css
.section-title {
  font-size: var(--heading-2);
  font-weight: var(--font-weight-black);
  line-height: var(--leading-tight);
  margin-block-end: var(--space-8);
}
```

**PMv3:** Each section inlines heading styles:
```html
<!-- About: -->
<h2 class="text-[var(--section-heading)] font-black leading-tight text-center mb-[var(--space-8)]">{title}</h2>

<!-- Focus: -->
<h2 class="text-[var(--section-heading)] font-black leading-tight text-center mb-[var(--space-8)]">{title}</h2>
```

The `section-title` utility already exists in `app.css` line 1097 but is NOT used by any section.

**Fix:** Replace inline heading classes with `section-title text-center` on all sections. The utility already sets `font-size: var(--heading-2)`, `font-weight: var(--font-weight-black)`, `line-height: var(--leading-tight)`, `margin-block-end: var(--space-8)`.

---

## Gap 12 🟡 — About Section: Paragraph Font Weight

**PMv2:** About paragraphs use `.section-body` which has `font-weight: var(--font-normal)` (400).

**PMv3:** About paragraphs inherit body's `font-weight: 300` (light). No explicit weight override.

**Fix:** Add `font-normal` (maps to `--font-weight-normal`: 400) to the about paragraph elements, matching PMv2's `.section-body` weight. Or use the `section-body` utility which already sets `font-weight: var(--font-weight-normal)`.

---

## Gap 13 🟡 — Section Backgrounds: Verify Exact Colors

**PMv2 background alternation:**
| Section | Background |
|---------|-----------|
| Hero | `var(--l-bg)` = `light-dark(#fbf2e7, #3b0902)` |
| About | `var(--l-bg-elevated)` = elevated surface |
| Focus | `var(--l-bg-sunken)` = sunken surface |
| F22 | `var(--l-bg)` = default |
| Contact | `var(--l-bg-elevated)` = elevated |

**PMv3 backgrounds:**
| Section | Class | Matches? |
|---------|-------|----------|
| Hero | `bg-pm-bg` | ✅ |
| About | `bg-pm-bg-elevated` | ✅ |
| Focus | `bg-pm-bg-sunken` | ✅ |
| F22 | (none, inherits body) | ✅ — equivalent to `bg-pm-bg` |
| Contact | `bg-pm-bg-elevated` | ✅ |

No gap. All backgrounds match.

---

## Verification Checklist (Post-Fix)

Run the dev server and visually verify:

- [ ] Hero section: title is at the same vertical position as live site (not pushed down 4rem)
- [ ] Hero section: logo plays stamp animation on first load
- [ ] About section: two-column layout at desktop (`lg`), image on left, text on right
- [ ] About section: visual area shows an image, not an `IconPhoto` placeholder
- [ ] Focus section: badges show translated text ("Разработка"/"Development"), not "dev"/"design"
- [ ] F22 section: logos switch language based on locale selector
- [ ] F22 section: description contains clickable links to fabrica22.pro and zinnatov.ru
- [ ] Contact section: contact info sidebar visible on right at desktop
- [ ] Contact form: Zod validation shows per-field errors in appropriate language
- [ ] Skip link: pressing Tab on page load focuses "Skip to content"
- [ ] All 4 locales render correctly: ru, en, fr, he (he = RTL)
- [ ] Dark/light theme toggle works

---

## Implementation Order

```
Gap 1  (Hero padding)         ← Biggest visual impact, 1-line change
Gap 10 (Focus badges i18n)    ← Trivially wrong, 2-line change
Gap 11 (Section headings)     ← Spans all sections, utility refactor
Gap 2  (About layout)         ← Structural change, 2-column grid
Gap 3  (About visual)         ← Replace placeholder with image
Gap 5  (F22 HTML)             ← @html render fix
Gap 4  (F22 logos i18n)       ← Locale-aware logo selection
Gap 6  (Contact sidebar)      ← New component/add to layout
Gap 7  (Contact Zod)          ← Schema + per-field errors
Gap 8  (Hero GSAP)            ← Animation integration
Gap 9  (Skip link)            ← WCAG accessibility
Gap 12 (About font weight)    ← Subtle typography fix
Gap 13 (Backgrounds)          ← Verify only, no changes
```
