# Portfolio Display Modes

There are 3 display modes for portfolio detail pages (`/portfolio/:slug`).

## 1. Branding — Fullscreen + Grid

| | |
|---|---|
| **DB type** | `branding` |
| **Default layout** | Fullscreen slides with image overlays |
| **Toggle** | Button to switch between fullscreen and grid |
| **Lightbox** | `BrandingViewer` — sections, gallery, client URL, tags |
| **Grid cards** | Image-first with hover-reveal info |

## 2. Website — Grid, Image Cards

| | |
|---|---|
| **DB type** | `website` |
| **Default layout** | Grid with image cards |
| **Toggle** | Hidden |
| **Lightbox** | `WebsiteViewer` — title, description/content, technologies, tags, live URL |
| **Grid cards** | Image-first with always-visible info (`portfolio-card--info-visible`) |
| **Uses** | Websites portfolio, tools/frameworks portfolio |

Items should have `thumbnail_url` set for image previews. Optional metadata (JSON): `liveUrl`, `technologies[]`.

## 3. Case Study — Grid, Text-Only Cards

| | |
|---|---|
| **DB type** | `case_study` |
| **Default layout** | Grid with text-only cards |
| **Toggle** | Hidden |
| **Lightbox** | Inline content — category, title, content (markdown `###` headings), description, tags |
| **Grid cards** | Text-only with brand left border (`portfolio-card--text-only`), no image placeholder |
| **Uses** | Terminals/kiosks portfolio |

No images needed. Items show `content`, `description`, and `tags`.

## Implementation

Mode logic in `app/pages/portfolio/[slug].vue`:

- `layoutMode` ref: `'fullscreen'` for branding, `'grid'` for website & case_study
- Grid card class: `portfolio-card--text-only` only for `case_study`
- Image div: hidden when `portfolio.type === 'case_study'`
- Toggle button: visible only for `branding`
- Lightbox content: inline for `case_study`, viewer component for `branding`/`website`

## Listing Page (`/portfolio`)

All portfolio cards show the same layout (`portfolio-card-image` + `portfolio-card-info`). The `portfolio-card-image` shows the explicitly uploaded cover image when available (admin-set `cover_image_url` takes priority), otherwise a 6-image grid from items' thumbnails, then to `IconPhoto` placeholder. No type-specific styling on the listing page.

## Adding a New Mode

1. Add a new entry in `PORTFOLIO_TYPE_REGISTRY` in `pm-core/app/portfolios/registry.ts`
2. Create a viewer component in `app/components/portfolios/`
3. Add the type check in `[slug].vue` for layout mode, card style, and lightbox content
