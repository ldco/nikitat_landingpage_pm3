# Design Tokens — Reference

This is the **required first lookup step** before inventing any new token or bracket value (AGENTS.md Rule A.1). Every token below is defined in `src/app.css` (`@theme` or `@layer base :root`) or `src/project/theme.css`. Use direct token-reference bracket syntax in components: `[var(--token)]`, optionally wrapped in `calc()`/`min()`/`max()`/`clamp()` composed only of token references and safe operators.

> Generated from `docs/traycer/token-inventory.md`. Keep the two documents in sync when adding/removing tokens.

---

## 1. Project Primitives (`src/project/theme.css`)

Change these 4 values to rebrand the entire site — everything else is derived.

| Token | Value | Example usage |
|---|---|---|
| `--p-brand` | `#901504` | `bg-[var(--p-brand)]` (usually via `--color-pm-brand`) |
| `--p-black` | `#3b0902` | dark ink / dark-mode background |
| `--p-white` | `#fbf2e7` | warm paper / light-mode background |
| `--p-accent` | `#901504` | accent (same as brand) |

---

## 2. Colors

### Brand
| Token | Purpose | Example |
|---|---|---|
| `--color-pm-brand` | Primary brand color | `text-pm-brand`, `bg-pm-brand` |
| `--color-pm-accent` | Accent color | `text-pm-accent` |
| `--color-pm-brand-light` | Brand lightened 15% (hover) | `hover:bg-pm-brand-light` |
| `--color-pm-brand-dark` | Brand darkened 10% (active) | `active:bg-pm-brand-dark` |
| `--color-pm-brand-subtle` | Brand ~90% transparent (tints) | `bg-pm-brand-subtle` |
| `--color-pm-brand-text` | Theme-aware brand text (light: brand, dark: tinted for AA contrast) | `text-pm-brand-text` |

### Neutrals
| Token | Purpose | Example |
|---|---|---|
| `--color-pm-black` | Brand ink | `bg-pm-black` |
| `--color-pm-white` | Brand paper | `text-pm-white` |
| `--color-pm-gray-50…900` | Neutral gray ramp (admin) | `bg-pm-gray-100` |

### Backgrounds
| Token | Purpose | Example |
|---|---|---|
| `--color-pm-bg` | Page background (theme-aware) | `bg-pm-bg` |
| `--color-pm-bg-elevated` | Raised surface (cards) | `bg-pm-bg-elevated` |
| `--color-pm-bg-sunken` | Recessed surface | `bg-pm-bg-sunken` |
| `--color-pm-surface` | Alias of `bg-elevated` | `bg-pm-surface` |

### Borders
| Token | Purpose | Example |
|---|---|---|
| `--color-pm-border` | Hairline border | `border-pm-border` |
| `--color-pm-border-strong` | Emphasis border | `border-pm-border-strong` |

### Text
| Token | Purpose | Example |
|---|---|---|
| `--color-pm-text` | Primary text | `text-pm-text` |
| `--color-pm-text-secondary` | Secondary text | `text-pm-text-secondary` |
| `--color-pm-text-muted` | Muted text | `text-pm-text-muted` |
| `--color-pm-muted` | Alias of `text-muted` | `text-pm-muted` |

### Semantic
| Token | Purpose | Example |
|---|---|---|
| `--color-pm-success` / `-bg` | Success fg/bg | `text-pm-success`, `bg-pm-success-bg` |
| `--color-pm-warning` / `-bg` | Warning fg/bg | `text-pm-warning` |
| `--color-pm-danger` / `-bg` | Danger fg/bg | `text-pm-danger`, `bg-pm-danger-bg` |
| `--color-pm-info` / `-bg` | Info fg/bg | `text-pm-info` |

### Focus
| Token | Purpose | Example |
|---|---|---|
| `--color-pm-focus-ring` | `:focus-visible` outline | `focus-visible:outline-pm-focus-ring` |
| `--color-pm-focus-outline` | Alias of focus-ring | — |

---

## 3. Typography

### Families
| Token | Example |
|---|---|
| `--font-sans` | `font-sans` (default body) |
| `--font-display` | `font-display` (headings) |
| `--font-mono` | `font-mono` (code) |

The `--font-sans` stack is multilingual and language-agnostic: Geologica/Inter
cover Latin + Cyrillic + Greek, and the script-support slot `--font-script`
carries OPTIONAL project fonts for every other script (Hebrew, Arabic,
Devanagari, CJK, …). The framework default is `system-ui` — the OS renders any
script — so the framework is ready for ANY language out of the box.
`--font-script` is a **project extension point**: a project overrides it in
`src/project/theme.css` (unlayered `:root` beats the framework's `@layer base`
default) with its brand script fonts, e.g.
`--font-script: 'Noto Sans Arabic', 'Noto Sans Devanagari';` plus the matching
`@fontsource` imports in `src/app.css`. Script glyphs render through the slot
wherever scripts mix (e.g. locale tabs listing every language at once).
Per-locale promotion is a project concern too: this project ships a `:lang(he)`
block in `src/project/theme.css` that moves the slot to the front of the stack
for Hebrew pages; Arabic/Hindi/etc. projects add `:lang(ar)` / `:lang(hi)`
blocks the same way. Components never switch the family for semantically-
identical content — hierarchy comes from weight/size, not from swapping to
`font-mono` (mono is reserved for genuine code/log content).

### Static sizes
| Token | Example |
|---|---|
| `--text-xs` … `--text-5xl` | `text-xs`, `text-2xl`, … |
| `--text-2xs` | badge text `text-2xs` |

### Fluid type scale
| Token | Example |
|---|---|
| `--text-fluid-xs` … `--text-fluid-5xl` | `text-fluid-3xl` |
| `--text-fluid-hero` / `-mobile` | `text-fluid-hero` |
| `--heading-1` … `--heading-4` | `text-[var(--heading-2)]` |
| `--text-hero-title-mobile` / `-ru` | `max-sm:text-[var(--text-hero-title-mobile)]` |
| `--text-hero-subtitle` | `text-[var(--text-hero-subtitle)]` |

### Weights & line heights
| Token | Example |
|---|---|
| `--font-weight-light…black` | `font-light` … `font-black` |
| `--leading-small` | `leading-[var(--leading-small)]` |
| `--leading-tight` | `leading-tight` |
| `--leading-normal` | `leading-normal` |
| `--leading-relaxed` | `leading-relaxed` |
| `--leading-hero-subtitle` | hero subtitle line-height |

---

## 4. Spacing

| Token | Example |
|---|---|
| `--spacing-fluid-xs` … `--spacing-fluid-2xl` | `p-[var(--spacing-fluid-md)]`, `gap-[var(--spacing-fluid-lg)]` |

Static spacing lives in `@layer base :root`: `--space-0`…`--space-32` (`p-[var(--space-4)]`, `mt-[var(--space-8)]`), `--gap-*` (`gap-[var(--gap-md)]`), `--icon-*`, `--touch-target`, `--avatar-*`.

---

## 5. Layout & Containers

| Token | Example |
|---|---|
| `--max-w-container` | `max-w-[var(--max-w-container)]` |
| `--max-w-content` | `max-w-[var(--max-w-content)]` |
| `--max-w-narrow` | `max-w-[var(--max-w-narrow)]` |
| `--max-w-prose` | `max-w-[var(--max-w-prose)]` |
| `--px-container` | `px-[var(--px-container)]` |
| `--h-header` / `--h-header-scrolled` | `h-[var(--h-header)]` |
| `--pt-section` | `pt-[var(--pt-section)]` |
| `--drawer-width` | `w-[var(--drawer-width)]` |
| `--dialog-max-height` | `max-h-[var(--dialog-max-height)]` |
| `--textarea-max-height` | AutoGrowTextarea cap (80dvh) — `max-h-[var(--textarea-max-height)]` |
| `--card-shell-bg` / `--card-shell-radius` / `--card-shell-pad-x` | Admin card shell shared by `AdminFormSection` cards and the `FormActions` footer bar so the two can never drift apart: `bg-[var(--card-shell-bg)]`, `rounded-[var(--card-shell-radius)]`, `px-[var(--card-shell-pad-x)]` |

> Prefer `<Container>` / `<SectionContent>` instead of hand-rolling container classes.

---

## 6. Z-Index

| Token | Value | Purpose |
|---|---|---|
| `--z-base` | 1 | default |
| `--z-hamburger` | 60 | hamburger trigger |
| `--z-dropdown` | 100 | dropdowns |
| `--z-sticky` | 200 | sticky elements |
| `--z-fixed` | 300 | fixed header/nav |
| `--z-drawer-backdrop` | 400 | drawer backdrop |
| `--z-drawer` | 500 | drawer panel |
| `--z-modal-backdrop` | 600 | modal backdrop |
| `--z-modal` | 700 | modal |
| `--z-popover` | 800 | popover |
| `--z-toast` | 900 | toast |

Use as `z-60`? **No** — use `z-hamburger`, `z-drawer`, etc. (auto-generated from `--z-*`).

---

## 7. Shadows

| Token | Example |
|---|---|
| `--shadow-sm` … `--shadow-xl` | `shadow-md` |
| `--shadow-frosted` / `-hover` / `-lg` | `shadow-frosted` |

---

## 8. Radii

| Token | Example |
|---|---|
| `--radius-xs` … `--radius-xl` | `rounded-xs` … `rounded-xl` |
| `--radius-full` | `rounded-full` |

---

## 9. Motion

### Durations
`--transition-fast` (150ms) · `--transition-normal` (200ms) · `--transition-slow` (300ms) · `--transition-slower` (400ms) · `--transition-spring`

### Easings
`--ease-out` · `--ease-in` · `--ease-elastic` · `--ease-smooth-out` · `--ease-smooth-in` · `--ease-in-out` · `--ease-smooth` · `--ease-bounce` · `--ease-spring`

Example: `transition-colors duration-200 ease-smooth`

---

## 10. Component Tokens

| Token | Purpose | Example |
|---|---|---|
| `--hero-min-height` | hero viewport height | `min-h-[var(--hero-min-height)]` |
| `--pt-hero` | hero top padding | `pt-[var(--pt-hero)]` |
| `--hero-logo-max-w` / `-mobile` | hero logo width | `max-w-[var(--hero-logo-max-w)]` |
| `--section-heading` | section heading size | via `<SectionHeading>` |
| `--text-section-body` | section body size | `text-[var(--text-section-body)]` |
| `--about-visual-width` / `-radius` / `--about-accent-height` | about visual | `w-[var(--about-visual-width)]` |
| `--contact-form-max-w` | contact form width | `max-w-[var(--contact-form-max-w)]` |
| `--form-textarea-min-h` | textarea min height | `min-h-[var(--form-textarea-min-h)]` |
| `--contact-icon-size` | contact icon button | `size-[var(--contact-icon-size)]` |
| `--focus-ring-width` | focus ring width | — |
| `--focus-card-accent-height` | focus-card accent bar | `border-t-[var(--focus-card-accent-height)]` |
| `--lightbox-max-*` | lightbox sizes | `max-w-[var(--lightbox-max-width)]` |
| `--brandbook-image-max-height` | brandbook image | `max-h-[var(--brandbook-image-max-height)]` |
| `--cookie-max-width` | cookie banner width | `max-w-[var(--cookie-max-width)]` |
| `--glass-backdrop-blur-*` | glass blur values | via `backdrop-blur-glass` infra utility |
| `--empty-state-*-height` | empty state heights | `min-h-[var(--empty-state-default-height)]` |
| `--footer-logo-height` / `-max-width` | footer logo size | `h-[var(--footer-logo-height)]` |
| `--slider-line-width` | before/after slider line | `w-[var(--slider-line-width)]` |

---

## 11. Breakpoints

| Token | Purpose |
|---|---|
| `--breakpoint-xs` | 480px — `xs:` variant |
| `--breakpoint-header` | 1120px — `header:` variant |

---

## Rules of Use

1. **First lookup** — check this document before inventing a new token or bracket value.
2. **No raw values** — never write `text-[14px]`, `max-w-[800px]`, literal colors, or an ad hoc literal mixed with a token reference. Promote recurring literals to named tokens.
3. **No token-bridge utilities** — `px-container`, `max-w-container`, etc. no longer exist; use the bracket form.
4. **Canonical primitives** — buttons → `<CtaButton>`, containers → `<Container>`, headings → `<SectionHeading>`, cards → `<Card>`, sections → `<Section>` (see `docs/contributing/canonical-primitives.md`).
