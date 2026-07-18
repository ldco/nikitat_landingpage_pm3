# Minimized Text Style System

**Status:** Implementation-ready  
**Target:** Puppet Master framework — `app/assets/css/`  

---

## Problem

The current text styling system has **85+ unique text-related CSS classes** with these concrete issues:

1. **Duplicate hero definitions:** `.hero-title` has two conflicting `font-size` values — `base.css` says `clamp(3.25rem, 9vw, 6.2rem)` but `sections.css` overrides with `clamp(2.5rem, 6vw, 4.5rem)`. Same conflict on `.hero-subtitle`.

2. **6 incompatible section-intro patterns:** `.section-subtitle`, `.about-content__lead`, `.experience-intro p`, `.approach-intro p`, `.economics-intro p`, `.case-study-lead` — each has different sizing, weight, line-height, and color for the same semantic role.

3. **200+ instances of 12–14px text:** `--text-xs` (12px) and `--text-sm` (14px) are used on labels, descriptions, metadata, hints, and footer text that people actually need to read.

4. **Body weight 300 on a slab-serif:** `--font-weight-body: 300` on Roboto Slab is too thin. Slab-serifs need minimum 400 for comfortable reading at body sizes.

5. **Dead code:** `.heading-xs` through `.heading-xl`, `.h1`–`.h6` utility classes, `.text-gradient` — all defined, zero usage found.

6. **Legacy color variables:** `--l-text`, `--l-text-secondary`, `--l-text-muted` still used in ~30 places instead of the newer `--t-primary`, `--t-secondary`, `--t-muted`.

---

## Target Architecture: 6-Tier Semantic Hierarchy

Extends the existing PM heading convention downward with semantic body-text classes:

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER          │ CLASS              │ ROLE                       │
├─────────────────────────────────────────────────────────────────┤
│ Display       │ .hero-title        │ Main page headline         │
│ Heading       │ .section-title     │ Section headings           │
│ Lead          │ .section-subtitle  │ Section intro / summaries  │
│ Body          │ .text-body         │ Main reading paragraphs    │
│ Small         │ .text-small        │ Secondary descriptions     │
│ Caption       │ .text-caption      │ Labels, dates, metadata    │
└─────────────────────────────────────────────────────────────────┘
```

### Specification

| Class | font-size | font-weight | line-height | color | max-width | Notes |
|-------|-----------|-------------|-------------|-------|-----------|-------|
| `.hero-title` | `clamp(2.5rem, 6vw, 4.5rem)` | `900` | `1.05` | `--t-primary` | — | Single definition in `base.css` only |
| `.section-title` | `clamp(1.75rem, 4vw, 2.5rem)` | `900` | `1.25` | `--t-primary` | — | Unchanged, keep as-is |
| `.section-subtitle` | `clamp(1.125rem, 2.5vw, 1.5rem)` | `400` | `1.6` | `--t-secondary` | `700px` | Merged with `.hero-subtitle` |
| `.text-body` | `1rem` (16px) | `400` | `1.5` | `--t-primary` | — | NEW — matches default `<p>` |
| `.text-small` | `0.875rem` (14px) | `400` | `1.45` | `--t-secondary` | — | NEW — was scattered `--text-sm` |
| `.text-caption` | `0.8125rem` (13px) | `400` | `1.35` | `--t-muted` | — | NEW — replaces `--text-xs` for readable text |

### Key Changes from Current

| Change | Before | After | Reason |
|--------|--------|-------|--------|
| Body weight | `300` (light) | `400` (normal) | Slab-serif is too thin at 300; readability |
| Minimum readable text | `12px` (--text-xs) | `13px` (--text-caption) | 12px on Roboto Slab at 300 is illegible |
| Hero subtitle | Separate `.hero-subtitle` class | Merged into `.section-subtitle` | Same role, same sizing |
| Section intros | 6 different patterns | Single `.section-subtitle` | Consistency |
| `.text-xs` (12px) | Used for labels, meta | Replaced by `.text-caption` | Only keep for true micro-text (badges, legal fine print) |

### What Stays

- **Component BEM classes** like `.feature-card__title`, `.portfolio-card-title`, `.blog-card__title` remain as-is — they define component-specific overrides on top of the base typography.
- **Size utility classes** `.text-xs`, `.text-sm`, `.text-lg`, `.text-xl`, `.text-2xl` remain for one-off sizing needs.
- **Color utilities** `.text-secondary`, `.text-muted`, `.text-brand` remain.
- **Heading utility classes** `.heading-xs`–`.heading-xl`, `.h1`–`.h6` — **removed** (dead code).
- **`.text-gradient`** — **removed** (dead code).

---

## CSS Changes: Phase 1 — Foundation

### 1.1 `typography/variables.css` — Font Weight & New Size Variable

**Change A: Body weight 300 → 400**

```css
/* Line 164: */
--font-weight-body: var(--font-normal);  /* was: var(--font-light) */
```

**Change B: Add 13px caption size variable**

```css
/* After --text-xs line, add: */
--text-caption: 0.8125rem;  /* 13px — minimum readable size */
```

### 1.2 `typography/base.css` — Consolidate & Add Semantic Classes

**Remove:** Duplicate `.hero-title` definition (lines 124–135). Keep the section-title/hero-title definitions in `sections.css` as the single source.

**Merge `.hero-subtitle` into `.section-subtitle`:** Keep one combined definition. Both selectors apply the same rules.

```css
/* Replace the .hero-subtitle / .section-subtitle block (lines 148–161) with: */
.hero-subtitle,
.section-subtitle {
  font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  font-weight: var(--font-weight-body);  /* now 400 */
  color: var(--t-secondary);
  max-inline-size: 700px;
  line-height: 1.6;
}

.hero-subtitle {
  margin-inline: auto;
  margin-block-end: var(--space-8);
}
```

**Remove `.text-gradient` block** (lines 164–169) — unused.

**Add new semantic body-text classes at end of file:**

```css
/* ═══════════════════════════════════════════════════════════════════════════
 * SEMANTIC BODY TEXT CLASSES
 * ═══════════════════════════════════════════════════════════════════════════ */

/* Body — main reading paragraphs */
.text-body {
  font-size: var(--text-base);
  font-weight: var(--font-weight-body);
  line-height: var(--leading-normal);
  color: var(--t-primary);
}

/* Small — secondary descriptions, card excerpts */
.text-small {
  font-size: var(--text-sm);
  font-weight: var(--font-weight-body);
  line-height: 1.45;
  color: var(--t-secondary);
}

/* Caption — labels, dates, metadata */
.text-caption {
  font-size: var(--text-caption);
  font-weight: var(--font-weight-body);
  line-height: 1.35;
  color: var(--t-muted);
}
```

### 1.3 `layout/sections.css` — Fix Hero Conflicts

**Remove the duplicate `.hero-title` block (lines 296–311).** Keep the responsive phone overrides for `.hero-title` (lines 381–400) since those are mobile-specific and correct.

**Remove the duplicate `.hero-subtitle` block (lines 334–340).** Keep the responsive phone overrides for `.hero-subtitle` (lines 402–409).

After removal, `.hero-title` and `.hero-subtitle` will be defined ONLY in `typography/base.css`.

### 1.4 `common/text.css` — Clean Dead Code

**Remove:** `.heading-xs` through `.heading-xl` blocks (lines 40–73). These are never used.

**Remove:** `.h1`–`.h6` rules from `base.css` lines 26–65 if they exist there (they are in `base.css` not `text.css` — check both).

---

## CSS Changes: Phase 2 — Unify Section Intros

### 2.1 Replace per-section intro patterns with `.section-subtitle`

Each section that currently uses a custom BEM intro class must be updated:

| Section | Current markup | New markup |
|---------|---------------|------------|
| **SectionHero** | `<p class="hero-subtitle">` | `<p class="hero-subtitle">` (keep, now merged with section-subtitle) |
| **SectionContact** | `<p class="section-subtitle contact-section__intro">` | `<p class="section-subtitle">` (already correct, drop unused `contact-section__intro`) |
| **SectionAbout** | `<p class="about-content__lead">` | `<p class="section-subtitle about-content__lead">` (`.about-content__lead` keeps only the accent bar, text styling comes from `.section-subtitle`) |
| **SectionExperience** | `<div class="experience-intro"><p>` | `<p class="section-subtitle">` (remove the wrapper div) |
| **SectionApproach** | `<div class="approach-intro"><p>` | `<p class="section-subtitle">` (remove the wrapper div) |
| **SectionEconomics** | `<div class="economics-intro"><p>` | `<p class="section-subtitle">` (remove the wrapper div) |

### 2.2 Clean up per-section CSS files

In each of these files, remove the intro-specific CSS blocks that are now handled by `.section-subtitle`:

**`ui/content/about.css`:** Remove `font-size`, `font-weight`, `line-height`, `color` from `.about-content__lead`. Keep only `margin`, `margin-block-end`, and the `::before` accent bar.

**`ui/content/experience.css`:** Remove the entire `.experience-intro` block (lines 1–12). The wrapper div no longer exists.

**`ui/content/approach.css`:** Remove the entire `.approach-intro` block and `.approach-paragraph` block. The wrappers no longer exist.

**`ui/content/economics.css`:** Remove the entire `.economics-intro` block. The wrapper no longer exists.

---

## CSS Changes: Phase 3 — Readability Audit

### 3.1 Replace `--text-xs` (12px) with `.text-caption` (13px) for readable text

Systematically review every `var(--text-xs)` usage. Where the text is meant to be read (labels, descriptions, meta, footer), replace with `var(--text-caption)`. Keep `var(--text-xs)` only for:

- Status badges (`.badge`)
- Legal fine print (`.legal-bar`)
- Cookie consent subtext
- Non-critical decorative text

**Files to audit (full list of `--text-xs` locations):**

| File | Selectors using `--text-xs` | Action |
|------|----------------------------|--------|
| `skeleton/header.css:264` | `.header-contact-cta-label` | → `.text-caption` |
| `ui/content/blog.css:101,166,378` | `.blog-card__category`, `.blog-card__date`, `.blog-card__meta-item` | → `.text-caption` |
| `ui/content/contact.css` | `.contact-detail__label` | → `.text-caption` |
| `ui/content/health.css:93,168,197,203,351,464,486,579,623` | Various admin labels | → `.text-caption` |
| `ui/content/badges.css:14,67` | `.badge` | **KEEP at `--text-xs`** |
| `ui/forms/inputs.css` | `.form-hint` | → `.text-caption` |
| `skeleton/footer.css:236,350,405` | `.made-with-text`, `.footer-legal`, etc. | → `.text-caption` |
| `ui/admin/pages.css:519,704,760,784,814,890` | Admin meta/labels | → `.text-caption` |

### 3.2 Replace legacy `--l-text*` with `--t-*` aliases

```css
/* In colors/auto.css — aliases already exist: */
--l-text:           var(--t-primary);     /* already defined */
--l-text-secondary: var(--t-secondary);   /* already defined */
--l-text-muted:     var(--t-muted);       /* already defined */
```

These aliases exist so the old variable names still work. No CSS changes needed for this — the aliases are in place. But any new CSS being written should use `--t-*` directly.

### 3.3 Update `.testimonial-card__name` and similar

These currently use `--l-text` (legacy). They're fine since the alias maps correctly, but audit that the font-weight on small text is at least 400.

---

## Component Changes

### 4.1 SectionHero.vue

```html
<!-- Before: -->
<p v-if="subtitle" class="hero-subtitle">

<!-- After: (no change needed — .hero-subtitle still works, now unified with .section-subtitle) -->
<p v-if="subtitle" class="hero-subtitle">
```

### 4.2 SectionContact.vue

```html
<!-- Before: -->
<p v-if="sectionIntro" v-reveal="{ animation: 'fade-up', delay: 80 }"
   class="section-subtitle contact-section__intro">

<!-- After: (drop the unused BEM class) -->
<p v-if="sectionIntro" v-reveal="{ animation: 'fade-up', delay: 80 }"
   class="section-subtitle">
```

### 4.3 SectionAbout.vue

```html
<!-- Before: -->
<p v-if="paragraph1" class="about-content__lead">{{ paragraph1 }}</p>
<p v-if="paragraph2" class="about-content__body">{{ paragraph2 }}</p>

<!-- After: (add section-subtitle for text styling, keep about-content__lead for accent bar) -->
<p v-if="paragraph1" class="section-subtitle about-content__lead">{{ paragraph1 }}</p>
<p v-if="paragraph2" class="text-body about-content__body">{{ paragraph2 }}</p>
```

### 4.4 SectionExperience.vue

```html
<!-- Before: -->
<div v-if="sectionIntro" v-reveal class="experience-intro">
  <p>{{ sectionIntro }}</p>
</div>

<!-- After: (remove wrapper div, use section-subtitle directly) -->
<p v-if="sectionIntro" v-reveal class="section-subtitle">{{ sectionIntro }}</p>
```

### 4.5 SectionApproach.vue

```html
<!-- Before: -->
<div v-if="sectionIntro" v-reveal class="approach-intro">
  <p>{{ sectionIntro }}</p>
</div>
<div v-if="sectionParagraph2" v-reveal class="approach-paragraph">
  <p>{{ sectionParagraph2 }}</p>
</div>

<!-- After: -->
<p v-if="sectionIntro" v-reveal class="section-subtitle">{{ sectionIntro }}</p>
<p v-if="sectionParagraph2" v-reveal class="text-body">{{ sectionParagraph2 }}</p>
```

### 4.6 SectionEconomics.vue

```html
<!-- Before: -->
<div v-if="sectionIntro" v-reveal class="economics-intro">
  <p>{{ sectionIntro }}</p>
</div>

<!-- After: -->
<p v-if="sectionIntro" v-reveal class="section-subtitle">{{ sectionIntro }}</p>
```

### 4.7 Card Components (add `.text-small` where appropriate)

Cards that have description text at `--text-sm` should add `.text-small`:

```html
<!-- Example: MoleculesFeatureCard.vue -->
<p class="feature-card__description text-small">{{ description }}</p>

<!-- Example: MoleculesPortfolioCard.vue -->
<p class="portfolio-card-description text-small">{{ description }}</p>
```

---

## Implementation Order

Tasks must be executed in this order to avoid broken intermediate states:

1. **CSS — Add new variables and classes** (`variables.css` + `base.css`)
   - Add `--text-caption: 0.8125rem`
   - Change `--font-weight-body: var(--font-normal)`
   - Add `.text-body`, `.text-small`, `.text-caption` classes
   - Merge `.hero-subtitle` / `.section-subtitle` definitions
   - Remove `.text-gradient` dead code

2. **CSS — Fix hero conflicts** (`sections.css`)
   - Remove duplicate `.hero-title` block (keep phone overrides)
   - Remove duplicate `.hero-subtitle` block (keep phone overrides)

3. **CSS — Clean dead code** (`common/text.css`)
   - Remove `.heading-xs` through `.heading-xl`

4. **Components — Update section intros** (`.vue` files)
   - SectionContact, SectionAbout, SectionExperience, SectionApproach, SectionEconomics
   - Remove wrapper divs, use `.section-subtitle` directly
   - Add `.text-body` to body paragraphs
   - Add `.text-small` to card descriptions

5. **CSS — Remove per-section intro styles** (content CSS files)
   - `about.css`, `experience.css`, `approach.css`, `economics.css`
   - Remove font-size/weight/line-height from intro rules
   - Keep only layout properties (margins, max-width, accent bars)

6. **CSS — Readability audit** (all `--text-xs` → `.text-caption`)
   - Walk every file from the audit table above
   - Replace `font-size: var(--text-xs)` with `font-size: var(--text-caption)` for readable text
   - Keep `--text-xs` only for badges and legal micro-text

7. **Verify** — Build and visual check
   - `npm run build` to ensure no CSS errors
   - `npm run dev` to visually verify all sections
   - Check mobile/tablet/desktop breakpoints
   - Check light/dark theme
   - Check RTL layout if applicable

---

## Validation Checklist

- [ ] `npm run build` passes with no CSS warnings
- [ ] Every section page renders its intro text at consistent sizing
- [ ] Hero page — title and subtitle display correctly at all breakpoints
- [ ] Section intros (About, Experience, Approach, Economics, Contact) all use identical text sizing
- [ ] Body text (`<p>`, `.text-body`) is weight 400, comfortably readable
- [ ] Card descriptions at 14px are weight 400 (not 300)
- [ ] Labels and metadata at 13px (not 12px) are readable
- [ ] Badges and legal fine print remain at 12px
- [ ] Light theme: text has sufficient contrast
- [ ] Dark theme: text has sufficient contrast
- [ ] Mobile (< 768px): no text overflows or is cut off
- [ ] No broken layout from removing wrapper divs in Experience/Approach/Economics sections

---

## Open Questions

1. **`.h5` / `.h6` classes:** These are in `base.css` with only `font-family` and `font-weight` (no explicit `font-size`). Are they used anywhere? If not, remove them alongside `.heading-xs`–`.heading-xl`.

2. **`.page-subtitle`:** Has two conflicting definitions (`page-header.css` at 16px vs `portfolio-grid.css` at 14px). Should this be unified under `.section-subtitle` or is it a different role?

3. **`.case-study-lead`:** Currently at `--text-xl` (20px) with `--l-text-secondary` color. Should this use `.section-subtitle` (which is larger) or remain distinct for case study pages?
