# PM Migration — Actual State (2026-07-19 04:59)

## Real Status

The entire Nuxt → SvelteKit migration has code written for all 16 phases,
but the CSS translation is INCOMPLETE and the database has ZERO content.

**The site currently:**
- Runs on SvelteKit with 0 build errors
- Has all component infrastructure (21 atoms, 6 molecules, 8 organisms, 13 sections)
- Has all routes (public, admin, blog, portfolio, legal)
- Has all API endpoints (15 public, 27 admin)
- **But** looks like generic Tailwind, not PM v2
- **But** dark mode doesn't switch colors properly
- **But** header/footer/sections don't match PM v2 layout
- **But** database has users + translations only — no content

---

## What Needs To Be Fixed

### P0 — CSS: PM v2 → Tailwind Translation Incomplete
- Header (header.css, 515 lines): fluid height, scroll glass, logo sizing, mobile centering
- Footer (footer.css, 478 lines): grid layout, legal bar, theme-logos, RTL — 80% missing
- Hero (sections.css, 485 lines): 2-column grid, hero-title fluid, section-body fill
- Layout patterns: image-placeholder, grid-2col, grid-auto, section-image
- Typography: heading hierarchy, hero-subtitle max-width, RTL

### P1 — Database: Zero Content
- 20 tables empty: portfolios, blog_posts, team_members, testimonials, faq_items, pricing_tiers, features, clients, contacts
- Sections render "No items" / empty state everywhere
- Need to port seed content from app-nuxt/server/database/seed*.ts into PM v3 seed
  
### P1 — Admin: Work in Progress
- Login/logout flow not tested end-to-end
- CRUD pages render data tables but have no Create/Edit/Delete forms
- No create/edit/delete modals — only read-only tables

### P2 — Remaining
- Ansible deploy.yml: rename 12 NUXT_BUILD_* → BUILD_*
- Testing (Phase 14): no tests written
- MCP Server (Phase 15): not started

---

## Git History

```
commit 2ec67de   Plan: complete rewrite — accurate state
commit d4b8e29   CSS layout fix + default content removal
commit 2a25668   Dockerfile adapted for PM v3
commit a31d64a   npm scripts (git:push)
commit a7ca23e   Git remotes
commit 56bc705   Public pages (legal + portfolio)
commit 06a171b   14 admin CRUD pages
commit 25b085c   Admin base (layout + login + dashboard)
commit 915ea64   Plugin quality fixes
commit 6d46fbf   Blog + Portfolio plugins
commit c88de70   Animations
commit 4a18820   ScrollSpy + nav
commit a169799   13 sections
commit 698d80c   Molecules & Organisms
commit 33a2701   CSS tokens + atoms
commit 380f80f   Phase 2
```

Build: `npm run check` 0 errors, `npm run build` ✓

---

## PM v2 CSS Inventory (124 files)

Source: `../app-nuxt/app/assets/css/`

### Translated (24 files)
Design tokens, reset, hamburger, buttons, inputs, cards, badges, avatars,
app-image, page-header, empty-states, lang-switcher, back-to-top, cookie-consent,
modal, toast, lightbox, nav, social-nav, contact-info.

### Partially Done (55 files)
Header (scroll/glass/logo missing), footer (grid + legal bar missing),
hero/sections, portfolio card/fullscreen, blog, falling-letters,
all 12 runtime section CSS files, all 11 admin CSS files, 6 animation files.

### Not Done (26 files)
Portfolio before-after slider, portfolio grid, error pages, legal pages,
loading placeholders, admin inbox/health/init, settings form, onepager parallax,
tabs (not created), data-table (not created), service-card, scrollbars,
search, master-detail layout, init wizard, page transitions, scrollytelling.

See PM-ARCHITECTURE-COMPLETE.md sections 16-34 for the full CSS architecture.
