# Token Inventory — PM v3 (`src/app.css` `@theme` + `src/project/theme.css`)

Source of truth after the dedup ticket (`04de766e-c65e-4042-bd15-69c9b34594f6`) was completed:

- `src/app.css` `@theme` block — framework-level design tokens (PM v2 → Tailwind v4).
- `src/project/theme.css` — project brand primitives that everything else derives from.

This inventory is generated for `docs/traycer/token-inventory.md` and consumed by
`docs/design-tokens.md` for the token-reference documentation ticket.

---

## 1. Project Primitives (`src/project/theme.css`)

| Token | Category | Purpose |
|---|---|---|
| `--p-brand` | color / brand | Primary brand color (`#901504`) — rebrand by changing this single value. |
| `--p-black` | color / brand | Near-black brand ink (`#3b0902`) used for light-mode text / dark-mode background. |
| `--p-white` | color / brand | Warm off-white brand paper (`#fbf2e7`) used for light-mode background / dark-mode text. |
| `--p-accent` | color / brand | Accent color (currently identical to `--p-brand`). |

---

## 2. Color Tokens (`@theme`)

### Brand
| Token | Category | Purpose |
|---|---|---|
| `--color-pm-black` | color | Aliases `--p-black` into Tailwind color namespace. |
| `--color-pm-white` | color | Aliases `--p-white` into Tailwind color namespace. |
| `--color-pm-brand` | color | Aliases `--p-brand` into Tailwind color namespace. |
| `--color-pm-accent` | color | Aliases `--p-accent` into Tailwind color namespace. |
| `--color-pm-brand-light` | color | Brand lightened 15% (hover/accent states). |
| `--color-pm-brand-dark` | color | Brand darkened 10% (active/pressed states). |
| `--color-pm-brand-subtle` | color | Brand at ~90% transparency, theme-aware (background tints, selection). |
| `--color-pm-brand-text` | color | Brand text, theme-aware (light: brand; dark: tinted 50% toward paper for AA contrast). |

### Gray Scale
| Token | Category | Purpose |
|---|---|---|
| `--color-pm-gray-50` … `--color-pm-gray-900` | color / gray | Neutral gray ramp (Tailwind palette) used in admin surfaces. |

### Backgrounds & Surfaces
| Token | Category | Purpose |
|---|---|---|
| `--color-pm-bg` | color / background | Page background (light = paper, dark = ink). |
| `--color-pm-bg-elevated` | color / background | Raised surface (cards, headers) — slight contrast from page bg. |
| `--color-pm-bg-sunken` | color / background | Recessed surface (wells, visual blocks). |
| `--color-pm-surface` | color / background | Semantic alias of `--color-pm-bg-elevated`. |

### Borders
| Token | Category | Purpose |
|---|---|---|
| `--color-pm-border` | color / border | Default hairline border color (theme-aware). |
| `--color-pm-border-strong` | color / border | Emphasis border (dividers, focus-adjacent lines). |

### Text
| Token | Category | Purpose |
|---|---|---|
| `--color-pm-text` | color / text | Primary text color (theme-aware). |
| `--color-pm-text-secondary` | color / text | Secondary text (subtitles, metadata). |
| `--color-pm-text-muted` | color / text | Muted text (captions, placeholders). |
| `--color-pm-muted` | color / text | Semantic alias of `--color-pm-text-muted`. |

### Semantic Status
| Token | Category | Purpose |
|---|---|---|
| `--color-pm-success` | color / semantic | Success foreground. |
| `--color-pm-success-bg` | color / semantic | Success background tint. |
| `--color-pm-warning` | color / semantic | Warning foreground. |
| `--color-pm-warning-bg` | color / semantic | Warning background tint. |
| `--color-pm-danger` | color / semantic | Danger/error foreground. |
| `--color-pm-danger-bg` | color / semantic | Danger/error background tint. |
| `--color-pm-info` | color / semantic | Info foreground. |
| `--color-pm-info-bg` | color / semantic | Info background tint. |

### Focus
| Token | Category | Purpose |
|---|---|---|
| `--color-pm-focus-ring` | color / focus | Accessible `:focus-visible` outline color. |
| `--color-pm-focus-outline` | color / focus | Alias of `--color-pm-focus-ring`. |

---

## 3. Typography Tokens (`@theme`)

### Font Families
| Token | Category | Purpose |
|---|---|---|
| `--font-sans` | typography / family | Primary UI sans (Geologica → Inter fallback). |
| `--font-display` | typography / family | Display/heading font (defaults to `--font-sans`). |
| `--font-mono` | typography / family | Monospace (JetBrains Mono) for code/data. |

### Font Sizes (static scale)
| Token | Category | Purpose |
|---|---|---|
| `--text-xs` … `--text-5xl` | typography / size | Static type scale (PM v2 base 1.25rem/20px). |
| `--text-2xs` | typography / size | 9px badge text. |

### Fluid Type Scale
| Token | Category | Purpose |
|---|---|---|
| `--text-fluid-xs` … `--text-fluid-5xl` | typography / fluid | Fluid responsive type (clamp). |
| `--text-fluid-hero` | typography / fluid | Hero headline fluid size (PM2). |
| `--text-fluid-hero-mobile` | typography / fluid | Hero headline fluid size, mobile (PM2). |
| `--heading-1` … `--heading-4` | typography / heading | Semantic heading scale (clamp, PM2). |

### Font Weights
| Token | Category | Purpose |
|---|---|---|
| `--font-weight-light` … `--font-weight-black` | typography / weight | Weight ramp (300–900). |

### Line Heights
| Token | Category | Purpose |
|---|---|---|
| `--leading-small` | typography / leading | 0.8 — tight display leading. |
| `--leading-tight` | typography / leading | 1.25 — headings. |
| `--leading-normal` | typography / leading | 1.5 — body. |
| `--leading-relaxed` | typography / leading | 1.625 — prose. |

---

## 4. Spacing Tokens (`@theme`)

| Token | Category | Purpose |
|---|---|---|
| `--spacing-fluid-xs` … `--spacing-fluid-2xl` | spacing / fluid | Fluid responsive spacing (clamp) for sections and gaps. |

> The static 4px spacing scale (`--space-0` … `--space-32`, `--gap-*`) lives in `@layer base :root` in `src/app.css` and is outside this `@theme` inventory.

---

## 5. Layout & Container Tokens (`@theme`)

| Token | Category | Purpose |
|---|---|---|
| `--container-narrow` | container | 48rem — narrow content column. |
| `--container-default` | container | 80rem — default content column. |
| `--container-wide` | container | 96rem — wide content column. |
| `--max-w-container` | container | `min(80rem, 100%)` — page container width. |
| `--max-w-content` | container | `min(62.5rem, 100%)` — content column width. |
| `--max-w-narrow` | container | `min(48rem, 100%)` — narrow column. |
| `--max-w-prose` | container | `min(65ch, 100%)` — prose measure. |
| `--px-container` | layout / padding | Fluid horizontal page padding (clamp 1–3rem). |
| `--h-header` | layout / header | Header height (fluid, 3.5–4.5rem). |
| `--h-header-scrolled` | layout / header | Header height when scrolled (3–3.5rem). |
| `--pt-section` | layout / section | Section top padding (header + fluid 2xl). |
| `--drawer-width` | layout / drawer | Mobile drawer width (`min(280px, 85vw)`). |
| `--dialog-max-height` | layout / dialog | Dialog max height (`100dvh − 2rem`). |

---

## 6. Z-Index Scale (`@theme`)

| Token | Category | Purpose |
|---|---|---|
| `--z-base` | z-index | 1 — default stacking. |
| `--z-hamburger` | z-index | 60 — hamburger trigger above header. |
| `--z-dropdown` | z-index | 100 — dropdowns/popovers. |
| `--z-sticky` | z-index | 200 — sticky elements. |
| `--z-fixed` | z-index | 300 — fixed header/nav. |
| `--z-drawer-backdrop` | z-index | 400 — drawer backdrop. |
| `--z-drawer` | z-index | 500 — drawer panel. |
| `--z-modal-backdrop` | z-index | 600 — modal backdrop. |
| `--z-modal` | z-index | 700 — modal dialog. |
| `--z-popover` | z-index | 800 — popovers above modals. |
| `--z-tooltip` | z-index | 850 — tooltips (PM2 parity). |
| `--z-toast` | z-index | 900 — toasts (topmost). |
| `--z-max` | z-index | 1000 — emergency escape hatch (avoid; PM2 parity). |

---

## 7. Shadow Tokens (`@theme`)

| Token | Category | Purpose |
|---|---|---|
| `--shadow-sm` | shadow | Small elevation. |
| `--shadow-md` | shadow | Medium elevation. |
| `--shadow-lg` | shadow | Large elevation. |
| `--shadow-xl` | shadow | Extra-large elevation. |
| `--shadow-frosted` | shadow | Frosted-glass card shadow (resting). |
| `--shadow-frosted-hover` | shadow | Frosted-glass card shadow (hover). |
| `--shadow-frosted-lg` | shadow | Frosted-glass card shadow (large). |

---

## 8. Radius Tokens (`@theme`)

| Token | Category | Purpose |
|---|---|---|
| `--radius-xs` | radius | 0.25rem — small chips. |
| `--radius-sm` | radius | 0.375rem — inputs. |
| `--radius-md` | radius | 0.5rem — buttons. |
| `--radius-lg` | radius | 0.75rem — cards, icon boxes. |
| `--radius-xl` | radius | 1rem — large cards. |
| `--radius-full` | radius | 9999px — pills, badges. |

---

## 9. Motion Tokens (`@theme`)

### Transition Durations
| Token | Category | Purpose |
|---|---|---|
| `--transition-fast` | transition | 150ms — micro-interactions. |
| `--transition-normal` | transition | 200ms — default. |
| `--transition-slow` | transition | 300ms — panels/drawers. |
| `--transition-slower` | transition | 400ms — reveals, overlays. |
| `--transition-spring` | transition | 300ms spring easing — playful motion. |

### Easings
| Token | Category | Purpose |
|---|---|---|
| `--ease-out` | easing | Ease-out cubic. |
| `--ease-in` | easing | Ease-in cubic (PM2). |
| `--ease-elastic` | easing | Elastic overshoot. |
| `--ease-smooth-out` | easing | Smooth ease-out. |
| `--ease-smooth-in` | easing | Smooth ease-in. |
| `--ease-in-out` | easing | Standard in-out. |
| `--ease-smooth` | easing | Smooth (Material-style). |
| `--ease-bounce` | easing | Bounce spring. |
| `--ease-spring` | easing | Spring overshoot. |

---

## 10. Component-Level Tokens (`@theme`)

### Hero
| Token | Category | Purpose |
|---|---|---|
| `--hero-min-height` | component / hero | Hero viewport height (`80vh`). |
| `--pt-hero` | component / hero | Hero top padding. |
| `--hero-leading` | component / hero | Hero headline line-height (0.9). |
| `--hero-leading-mobile` | component / hero | Hero headline line-height on mobile (0.8). |
| `--text-hero-title-mobile` | component / hero | Hero title fluid size (mobile clamp). |
| `--text-hero-title-mobile-ru` | component / hero | Hero title fluid size for `ru` locale (PM2 `.hero-title--ru`). |
| `--text-hero-subtitle` | component / hero | Hero subtitle fluid size (PM2 `.hero-subtitle`). |
| `--leading-hero-subtitle` | component / hero | Hero subtitle line-height (1.6). |
| `--max-w-hero-subtitle` | component / hero | Hero subtitle max width (700px). |
| `--hero-logo-max-w` | component / hero | Hero logo max width (`min(420px, 42vw)`). |
| `--hero-logo-max-w-mobile` | component / hero | Hero logo max width on mobile. |

### Sections
| Token | Category | Purpose |
|---|---|---|
| `--section-heading` | component / section | Section heading fluid size. |
| `--text-section-body` | component / section | Section body fluid size. |
| `--about-visual-width` | component / about | About visual width (62.5%). |
| `--about-visual-radius` | component / about | About visual blob radius (40%). |
| `--about-accent-height` | component / about | About accent bar height (3px). |
| `--contact-form-max-w` | component / contact | Contact form max width (40rem). |
| `--form-textarea-min-h` | component / contact | Contact form textarea min height (150px). |
| `--contact-icon-size` | component / contact | Contact icon button size (2.125rem). |

### Lightbox / Cookie / Brandbook
| Token | Category | Purpose |
|---|---|---|
| `--lightbox-max-width` | component / lightbox | Lightbox max width (90vw). |
| `--lightbox-max-height` | component / lightbox | Lightbox max height (85vh). |
| `--lightbox-image-max-height` | component / lightbox | Lightbox image max height (80vh). |
| `--brandbook-image-max-height` | component / brandbook | Brandbook image max height (70vh). |
| `--cookie-max-width` | component / cookie | Cookie banner max width (92rem). |

### Glass / Frosted
| Token | Category | Purpose |
|---|---|---|
| `--glass-backdrop-blur` | component / glass | Base glass blur (14px, PM2). |
| `--glass-backdrop-blur-subtle` | component / glass | Subtle glass filter. |
| `--glass-backdrop-blur-elevated` | component / glass | Elevated glass filter. |
| `--glass-backdrop-blur-strong` | component / glass | Strong glass filter. |
| `--glass-backdrop-blur-nav` | component / glass | Nav glass blur (4px). |

### Empty States & Focus
| Token | Category | Purpose |
|---|---|---|
| `--empty-state-compact-height` | component / empty | Compact empty state height (120px). |
| `--empty-state-default-height` | component / empty | Default empty state height (200px). |
| `--empty-state-large-height` | component / empty | Large empty state height (400px). |
| `--focus-ring-width` | component / focus | Focus ring width (3px). |
| `--focus-card-accent-height` | component / focus | Focus-card top accent bar height (3px). |

---

## 12. Footer Logo Tokens (`@layer base :root` in `src/app.css`)

| Token | Category | Purpose |
|---|---|---|
| `--footer-logo-height` | layout / footer | Footer logo height (2rem) — promoted from the removed `footer-logo` utility fallback. |
| `--footer-logo-max-width` | layout / footer | Footer logo max width (220px) — promoted from the removed `footer-logo` utility fallback. |
| `--slider-line-width` | layout / slider | Before/after slider handle line width (2px). |

---

## 11. Breakpoints (`@theme`)

| Token | Category | Purpose |
|---|---|---|
| `--breakpoint-xs` | breakpoint | 480px — extra-small custom variant. |
| `--breakpoint-header` | breakpoint | 1120px — header layout custom variant. |

---

## Removed Tokens (this ticket)

The following legacy aliases were removed in this ticket — verified to have zero runtime
consumers via repo-wide grep over `*.svelte`, `*.css`, `*.ts`, `*.js`:

| Removed Token | Former Value | Replacement |
|---|---|---|
| `--color-pm-bg-muted` | `var(--color-pm-bg-elevated)` | `--color-pm-bg-elevated` |
| `--color-pm-bg-dark` | `var(--p-black)` | `--color-pm-black` |
| `--color-pm-bg-dark-muted` | `color-mix(in srgb, var(--p-black), var(--p-white) 10%)` | `--color-pm-bg-sunken` (closest) |
| `--color-pm-muted-dark` | `#9ca3af` | `--color-pm-gray-400` |

The duplicate `--z-base` … `--z-toast` block in `@theme` was removed; the canonical scale
now lives at the single z-index section in `@theme`, including `--z-hamburger: 60`
(consumed by `src/routes/admin/+layout.svelte`).
