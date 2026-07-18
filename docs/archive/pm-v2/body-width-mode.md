# Content Width Modes

Framework-level control over header/footer chrome width and main body content width.

## Config

`project/puppet-master.config.ts` → `features`

| Setting | Values | Controls |
|---------|--------|----------|
| `headerFooterWidthMode` | `'contained'` / `'full'` | Header and footer inner content width |
| `bodyWidthMode` | `'contained'` / `'full'` | Main body content (containers, sections, hero) |

| Value | Width |
|-------|------|
| `contained` | Constrained to `--content-default` (1280px) |
| `full` | Edge-to-edge (no max-width) |

Both settings are independent — you can mix wide chrome with narrow body and vice versa.

## Combos

| headerFooterWidthMode | bodyWidthMode | Result |
|----------------------|---------------|--------|
| `contained` | `contained` | Everything 1280px |
| `full` | `contained` | Wide header/footer, narrow body |
| `contained` | `full` | Narrow header/footer, wide body |
| `full` | `full` | Everything edge-to-edge |

## CSS Architecture

### Container variables (`containers.css`)
- `--container-max: 1280px` defined on `:root` — controls section/hero max content width
- `.layout--body-full .main .container:not([class*="container-"])` — lifts container max-width
- `.layout--body-full.onepager .scene-full-bleed` — onepager scene override

### Hero section (`sections.css`)
- `.section-hero` uses `var(--space-6, 1.5rem)` + `var(--container-max, 1280px)` fallbacks for pre-CSS window
- `.layout--body-full .section-hero` — body-full hero padding override
- `.layout--body-full .section-hero--center > .container` — center-hero container override
- Mobile hero preserves `padding-inline: var(--space-2)` via `@media (--phone)`

### Layout components
- `default.vue`: reads `config.features.bodyWidthMode`, applies `.layout--body-full` class
- `blank.vue`: same pattern for blank layout pages

## Hero background

Removed missing `layer1.png`/`layer1dark.png` from `.section-hero` background — only `bg1.png` and `bg1dark.png` remain.

## Other fixes

- `heroParallax: false` — disabled since project has no parallax cloud/landmark assets. When enabled without assets, the `<ClientOnly>` parallax wrapper triggers a hydration reflow causing layout jump.
- `postinstall` script no longer runs `assets:optimize` — image optimization is build-only via `prebuild`.

## Hero Alignment — LTR / RTL

Refactored hero title, subtitle, and button alignment to use CSS logical properties that resolve correctly for both LTR and RTL without direction-specific rules.

### Root cause
- Container used `align-items: flex-end` for `--right` → resolved to LEFT in RTL (cross-axis end = left)
- Title lines used `margin-inline-start: auto` for `--right` → pushed elements LEFT in RTL
- Buttons used `justify-content: flex-end` for `--right` → pushed buttons LEFT in RTL
- Subtitle had global `margin-inline: auto` → always centered, ignoring direction
- Phone media queries had hardcoded `text-align: left` → broke RTL on mobile

### Fix (`sections.css`)
- Container: `align-items: flex-start` for both `--left` and `--right` (resolves to correct edge per writing direction)
- Title lines: `margin-inline-end: auto` for both variants (pushes to inline-start)
- Buttons: `justify-content: flex-start` for both variants
- Phone: all `text-align: left` → `text-align: start`

### Fix (`typography/base.css`)
- Subtitles: removed `margin-inline: auto` — now follows container's `align-items: flex-start`
- Added `.section-hero--center .hero-subtitle { margin-inline: auto }` to preserve centering for center variant
