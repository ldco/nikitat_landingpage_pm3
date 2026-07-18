# Roman Zinnatov IT Consulting — Origami Scrollytelling Website

## Goal
Build a performance-optimized, Russian-language single-page website for Roman Zinnatov IT Consulting using the Puppet Master framework. The visual centerpiece is a Canvas 2D origami backdrop that morphs through 5 geometric phases driven by native scroll progress.

## PM Convention Compliance (Hard Constraints)

| Rule | How We Comply |
|------|--------------|
| Global CSS only, no scoped styles | All canvas/section CSS in `app/assets/css/`, BEM naming, 5-layer order |
| `<script setup lang="ts">` everywhere | Every component uses it |
| Typed props/emits | TypeScript interfaces for all |
| Config-driven | Phase geometries, section ordering, feature flags in config |
| Atomic component layers | Canvas backdrop = organism, new sections = sections layer |
| `use*()` composables | `useOrigamiCanvas()` mirrors `useScrollytelling()` pattern |
| Zod + `createError()` | Any new API endpoints follow PM API rules |
| Drizzle ORM only | Translations stored in database, seeded via `db:seed` |
| Icons from `~icons/tabler/` | Navigation, CTA, section icons all Tabler-sourced |
| No inline styles | All styling via global CSS classes |

## Architecture

```
OrgansOnepagerThreeStoryScene (canvas backdrop, z-index: 0, pointer-events: none)
  └── useOrigamiCanvas({ phases: [...] })
        ├─ reads --pm-scene-progress from scene DOM elements
        ├─ interpolates grid vertices per phase
        └─ rAF loop → ctx.fill(), ctx.stroke()

Semantic HTML sections (z-index: 1+)
  ├── #home    → SectionsSectionHero
  ├── #approach → SectionsSectionApproach
  ├── #economics → SectionsSectionEconomics
  ├── #formats → SectionsSectionFormats
  ├── #experience → SectionsSectionExperience
  ├── #about → SectionsSectionAbout
  └── #contact → SectionsSectionContact

useScrollytelling() → --pm-scene-progress per scene (already implemented)
```

## Grid-Based Folding Geometry (Approach C)
- Regular `cols × rows` quad grid as topology backbone
- Each phase defines per-vertex displacement targets
- O(n) interpolation, no Delaunay per frame
- 5 phases map to 7 sections (formats+experience and about+contact share phases)

## Task List

### TASK 0: Project Initialization
- Set pmMode: 'build'
- Add Russian locale
- Update sections array (7 sections)
- Disable unused modules
- Configure brand colors
- Run db:push

### TASK 1: useOrigamiCanvas composable
### TASK 2: OrganismsOrigamiBackdrop organism (replace OnepagerThreeStoryScene content)
### TASK 3: Phase geometry definitions constant
### TASK 4: 5 new section components + adapt existing SectionAbout
### TASK 5: Global CSS for all new elements
### TASK 6: Russian translations database seed
### TASK 7: Index page adaptation
### TASK 8: CSS main entry wiring
### TASK 9: Validation & build
