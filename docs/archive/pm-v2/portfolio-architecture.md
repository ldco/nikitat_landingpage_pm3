# Portfolio Architecture — Core PM Framework Module

## Status: Proposed

---

## Context

### What we're building
The portfolio system for the **Puppet Master framework** — not just this project. It must support:
- **Today**: Branding case studies (36 items), Brandbooks (PDF/page viewer), Websites (screenshots + links)
- **Tomorrow**: Any new portfolio type a PM user might need (motion design, packaging, illustrations, 3D, etc.)

### Current system
Two-level discriminator pattern already exists:
- `portfolios.type`: `'gallery'` | `'case_study'` — portfolio-level behavior
- `portfolio_items.itemType`: `'image'` | `'video'` | `'link'` | `'case_study'` — item-level rendering

### Key constraint
Adding a **new portfolio type must require zero schema migrations**. The only changes should be:
1. Define a type config object
2. Create a viewer component  
3. Register it

Everything else (admin forms, API validation, card rendering, public pages) should auto-adapt.

---

## Decision: Type Registry + Entity-Component Pattern

### Core idea
Portfolio types are **declared, not coded**. Each type is a self-contained definition that plugs into a shared infrastructure. The infrastructure (grids, cards, lightbox, admin CRUD, API routes) doesn't know about specific types — it reads the registry.

### Type Registry (the extensibility contract)

```typescript
// pm-core/app/portfolios/registry.ts

interface PortfolioTypeDefinition {
  /** Unique type ID, stored in portfolios.type column */
  id: string
  /** Human labels per locale */
  label: Record<string, string>
  /** Tabler icon name for admin badges */
  icon: string
  /** Which base itemType to use for items of this portfolio type */
  baseItemType: 'case_study' | 'gallery'
  /** Zod schema for the metadata JSON column */
  metadataSchema: z.ZodSchema
  /** Lazy-loaded async component for the detail viewer */
  viewer: () => Promise<Component>
  /** Optional: custom card component (falls back to PortfolioCard.vue) */
  card?: () => Promise<Component>
  /** Optional: custom admin item form section (falls back to case study form) */
  adminForm?: () => Promise<Component>
  /** Optional: custom admin item list columns */
  adminColumns?: AdminColumn[]
  /** Optional: custom sections for the public detail header */
  headerSections?: HeaderSection[]
}

// Built-in registry — PM users add entries here:
export const PORTFOLIO_TYPE_REGISTRY: Record<string, PortfolioTypeDefinition> = {
  branding:    { /* ... */ },
  brandbook:   { /* ... */ },
  website:     { /* ... */ },
  // Future: motion, packaging, illustration, ...
}
```

### How the registry flows through the system

```
PORTFOLIO_TYPE_REGISTRY
  │
  ├─→ API validation: metadataSchema → Zod validation on create/update
  ├─→ Admin UI:      label + icon + adminForm → auto-generated forms
  ├─→ Public page:    viewer() + headerSections → dynamic component
  ├─→ Portfolio list: label + icon → type badges on listing
  └─→ Section:        all types rendered by SectionPortfolio.vue consistently
```

### Data Model (zero migrations for new types)

```sql
-- portfolios table — NO CHANGE except extending the type enum check
-- type: 'gallery' | 'case_study' | 'branding' | 'brandbook' | 'website' | ...

-- portfolio_items table — ADD 1 column only:
ALTER TABLE portfolio_items ADD COLUMN metadata TEXT;
-- JSON blob: type-specific data
--   branding:  { "sections": [...], "clientUrl": "...", "tags": [...] }
--   brandbook: { "pages": [{"url":"...","order":1,"caption":"Cover"},...], "pdfUrl":"..." }
--   website:   { "liveUrl":"...", "screenshots": [...], "technologies": [...] }
--   motion:    { "vimeoId":"...", "duration":"...", "aspectRatio":"..." }
--   etc...

-- This is the ONLY schema change needed. Forever.
-- No aux tables. All type-specific data is in metadata JSON.
```

**Rationale for JSON metadata over aux tables:**
- SQLite can't query into JSON anyway (no `jsonb_path_ops`), so no loss
- Metadata is read at detail-view time (single item), not in list queries
- List queries only need `title`, `description`, `tags`, `category`, `mediaUrl` — all top-level columns
- Admin CRUD on nested data (pages, screenshots) handled by the type's `adminForm` component

### Component Architecture

```
pages/portfolio/index.vue
  └── loops PORTFOLIO_TYPE_REGISTRY → renders type badges + portfolio cards

pages/portfolio/[slug].vue
  ├── reads portfolio.type → looks up PORTFOLIO_TYPE_REGISTRY[type]
  ├── PortfolioHeader (cover, title, description, type badge from registry)
  └── PortfolioItemGrid (responsive CSS grid, same for all types)
      └── <component :is="registryEntry.card" />  ← per card
  └── Teleported viewer:
      └── <component :is="registryEntry.viewer" />  ← per type

components/sections/SectionPortfolio.vue
  └── same pattern, onepager mode
```

### Adding a new type — the 3-step workflow

```typescript
// 1. Define the type config
// pm-core/app/portfolios/types/motion.ts

import { z } from 'zod'

export const motionType: PortfolioTypeDefinition = {
  id: 'motion',
  label: { en: 'Motion Design', ru: 'Моушн-дизайн', he: 'עיצוב תנועה' },
  icon: 'video',
  baseItemType: 'case_study',
  metadataSchema: z.object({
    vimeoId: z.string().optional(),
    aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
    duration: z.string().optional(),
  }),
  viewer: () => import('~/components/portfolios/MotionViewer.vue'),
}

// 2. Create the viewer component
// components/portfolios/MotionViewer.vue
// <script setup lang="ts">
// import type { CaseStudyPortfolioItem } from '~/types'
// const props = defineProps<{ item: CaseStudyPortfolioItem }>()
// const metadata = parseMetadata(props.item.metadata, motionType.metadataSchema)
// </script>

// 3. Register
// pm-core/app/portfolios/registry.ts — add one line:
export const PORTFOLIO_TYPE_REGISTRY = {
  // ... existing types ...
  motion: motionType,
}
```

**That's it.** Admin forms auto-generate. Cards render. Routes work. No migrations.

---

## Options Considered

### Option A: Extend `itemType` + aux tables (rejected)
Add `'brandbook'` and `'website'` to `PORTFOLIO_ITEM_TYPES`. Add `brandbook_pages` and `website_screenshots` tables.

| Pros | Cons |
|------|------|
| Strong DB normalization | Each new type = new migration + new aux table |
| SQL-queryable sub-data | Bloat in `itemType` union everywhere |
| | NOT extensible — defeats the PM framework requirement |

### Option B: Per-type separate tables (rejected)
Each portfolio type gets its own `portfolios_*` and `portfolio_items_*` tables, API routes, admin pages.

| Pros | Cons |
|------|------|
| Perfect normalization | 3×+ code duplication |
| | Admin UI explosion |
| | Shared portfolio list page becomes complex |
| | NOT extensible |

### Option C: Type Registry + JSON metadata (chosen)
One `metadata` JSON column. Types declare their schema, viewer, and admin form. Registry maps type → behavior.

| Pros | Cons |
|------|------|
| Zero schema migrations for new types | JSON not queryable (mitigated: only used in detail view) |
| 3 steps to add a type | Metadata type safety needs runtime Zod validation |
| Minimal code changes per new type | Nested array editing in admin (mitigated by type-specific adminForm) |
| Backward compatible (NULL metadata = legacy) | |
| Becomes PM framework core module | |

---

## Implementation Plan

### Phase 1: Core Infrastructure (foundation — all other phases depend on this)

**Story 1.1 — Schema**: Add `metadata TEXT` to `portfolio_items`. Extend `PORTFOLIO_TYPES` const. No other schema changes.
**Story 1.2 — Registry**: Create `pm-core/app/portfolios/registry.ts` with the `PortfolioTypeDefinition` interface and empty registry.
**Story 1.3 — Types**: Add `PortfolioItemMetadata` discriminated union and Zod schemas to TypeScript types.

### Phase 2: Branding Type (first concrete type — validates the registry)

**Story 2.1 — Type definition**: Register `branding` type with metadata schema, icon, labels.
**Story 2.2 — Viewer**: `BrandingViewer.vue` — case study detail + lightbox gallery (extracted from existing inline logic).
**Story 2.3 — Seed script**: Read `portfolio-parsed.json`, create "Брендинг" portfolio, insert 36 items with `type: 'branding'`, populate `metadata` JSON with sections/tags/clientUrl, copy images to `public/uploads/portfolios/branding/`.

### Phase 3: Brandbook Type

**Story 3.1 — Type definition**: Register `brandbook` type with metadata schema (pages array + pdfUrl).
**Story 3.2 — Viewer**: `BrandbookViewer.vue` — page-flip viewer. Support two modes: image pages array (from metadata) and PDF.js rendering (from pdfUrl).
**Story 3.3 — Admin form**: Brandbook-specific admin form with page upload/reorder.

### Phase 4: Website Type

**Story 4.1 — Type definition**: Register `website` type with metadata schema (liveUrl, screenshots, technologies).
**Story 4.2 — Viewer**: `WebsiteViewer.vue` — screenshot carousel with device tabs + live link button.
**Story 4.3 — Admin form**: Website-specific admin form with screenshot upload + URL field.

### Phase 5: Integration

**Story 5.1 — Dynamic viewer**: Modify `portfolio/[slug].vue` to use `<component :is="registry[portfolio.type].viewer">` and read type metadata from registry.
**Story 5.2 — Section component**: Modify `SectionPortfolio.vue` to use registry for card rendering and viewer selection.
**Story 5.3 — Admin**: Modify `admin/portfolios/[id].vue` to show type-specific adminForm sections from registry.

### Phase 6: CSS

**Story 6.1 — Type-specific CSS**: Import and apply CSS per type via registry (each type can declare its CSS import in the definition).
**Story 6.2 — Brandbook CSS**: Page-flip animations, page counter, PDF download button.
**Story 6.3 — Website CSS**: Screenshot carousel, device tabs, live-link button styling.

---

## Dependency Graph

```
Phase 1 (Infrastructure)
  ├─→ Phase 2 (Branding) ──┐
  ├─→ Phase 3 (Brandbook)  ├─→ Phase 5 (Integration) → Phase 6 (CSS)
  └─→ Phase 4 (Website) ───┘
```

Phases 2, 3, 4 are **parallel** — they only depend on Phase 1.

---

## Verification Checklist

- [ ] Adding a new portfolio type requires <50 lines of code (type def + viewer + register)
- [ ] Zero SQL migrations needed for new types
- [ ] All 36 branding items render with lightbox on `/portfolio/branding`
- [ ] Brandbook viewer flips pages with prev/next navigation
- [ ] Website viewer shows screenshots with live link
- [ ] Admin UI shows type-specific forms based on registry
- [ ] Existing `gallery` and `case_study` portfolios still work (backward compat)
- [ ] SectionPortfolio works in onepager mode for all types
- [ ] Cards auto-adapt: info visible by default for case_study types, hover-reveal for gallery
- [ ] Mobile: touch/swipe for page-flip and carousel
- [ ] No hardcoded colors, no scoped styles
- [ ] Registry is the SINGLE source of truth for type behavior

---

## Migration Path

1. **Existing data**: `portfolio_items` without `metadata` → NULL → treated as legacy `gallery`/`case_study`
2. **Existing admin**: No change to gallery/case_study workflows
3. **Rollback**: Remove `metadata` column → no data loss (metadata is additive)
4. **Feature flags**: Registry entries can have `enabled: false` for WIP types

---

## Edge Case Stress Test

| Scenario | Handling |
|----------|----------|
| Unknown portfolio type in registry | Fallback to `PortfolioCard.vue` + basic image lightbox |
| Corrupted metadata JSON | Zod parse → fallback to `{}` + console warning |
| 100+ brandbook pages | Virtual scroll / lazy load pages on navigation |
| Image 404 in viewer | `content-card-placeholder` + `IconPhoto` fallback |
| PDF fails to load | Fallback to image pages list if available, else error state |
| liveUrl without protocol | Auto-prefix `https://` |
| No items in portfolio | Empty state: `t('portfolio.noItems')` with type-appropriate messaging |
| Mobile device | Touch/swipe gestures, stacked cards, fullscreen viewer |
| Cross-type item navigation | Not supported — viewer is per-portfolio-type |
