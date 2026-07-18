# Vanilla Puppet Master Framework Extraction

## Goal

Extract a clean, vanilla Puppet Master framework from the nikitat project (the most feature-complete PM implementation to date) into:

```
/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/CURRENT_WORKING_DEV/PuppetMaster2/app
```

This vanilla version becomes **THE canonical PM framework project folder** — a clean starting point for any new PM-based project, including the mature portfolio system.

---

## Architecture: What Is PM Framework vs What Is nikitat

### Classification

| Layer | Status | Notes |
|-------|--------|-------|
| `pm-core/` | **FRAMEWORK** | Core types, helpers, nuxt layer config |
| `app/components/atoms/` | **FRAMEWORK** | Reusable atoms (buttons, inputs, etc.) |
| `app/components/molecules/` | **FRAMEWORK** | Composite UI elements |
| `app/components/organisms/` | **FRAMEWORK** | Complex UI blocks (header, footer, nav) |
| `app/components/portfolios/` | **FRAMEWORK** | Portfolio display system ✅ |
| `app/components/sections/Section{Generic}.vue` | **FRAMEWORK** | Hero, About, Contact, Blog, Portfolio, Pricing, Faq, Team, Testimonials, Clients, Features |
| `app/components/sections/SectionF22.vue` | **NIKITAT** | Fabrica22 branding section |
| `app/components/sections/SectionFocus.vue` | **NIKITAT** | Focus/services cards (custom CSS) |
| `app/composables/`, `stores/`, `utils/`, `lib/` | **FRAMEWORK** | All composables, state, utilities |
| `app/pages/` | **FRAMEWORK** | All pages (index, [section], admin/*, blog/*, portfolio/*, login, init, legal/*) |
| `app/layouts/`, `middleware/`, `plugins/`, `constants/` | **FRAMEWORK** | App infrastructure |
| `app/assets/css/` | **FRAMEWORK** | Entire CSS system (5-layer architecture) |
| `app/assets/css/runtime/section-focus.css` | **NIKITAT** | Custom CSS for SectionFocus |
| `server/` | **FRAMEWORK** | Entire server (API, DB schema, middleware, plugins, utils, repos) |
| `server/database/seed-portfolio.ts` | **MIXED** | Framework seed logic + nikitat portfolio data |
| `server/database/seed-gallery.ts` | **MIXED** | Framework seed logic + nikitat gallery data |
| `server/database/seed-content-translations.ts` | **MIXED** | Framework seed logic + nikitat translations |
| `i18n/` | **FRAMEWORK** | i18n framework (system-seed.json, loader, config) |
| `i18n/content.ts` | **MIXED** | Framework content seed logic + nikitat content |
| `shared/` | **FRAMEWORK** | Shared domain types |
| `types/` | **FRAMEWORK** | TypeScript types |
| `scripts/` | **FRAMEWORK** | All scripts (deploy, init, build, etc.) |
| `project/puppet-master.config.ts` | **MIXED** | Framework config structure + nikitat values |
| `project/init/` | **FRAMEWORK** | Init wizard prompts and defaults |
| `public/logos/` | **NIKITAT** | nikitat project logos |
| `public/images/` | **NIKITAT** | nikitat images (about/, hero/, frame_0019.png) |
| `public/favicon.svg` | **NIKITAT** | nikitat favicon |
| `public/og-image.*` | **NIKITAT** | nikitat OG images |
| `public/madebylogos/` | **FRAMEWORK** | Developer "Made by" branding (DO NOT TOUCH) |
| `public/puppetmaster/` | **FRAMEWORK** | PM framework assets |
| `legal/` | **MIXED** | Legal page framework + nikitat-specific legal text |
| `docs/` | **MIXED** | PM architecture docs (keep) + nikitat audit docs (strip) |
| `contributing/` | **FRAMEWORK** | PM contribution docs |
| `ansible/` | **FRAMEWORK** | Deployment automation |
| `Dockerfile`, `.dockerignore` | **FRAMEWORK** | Container setup |
| `tests/`, `e2e-playwright/` | **FRAMEWORK** | Test framework |
| `.storybook/` | **FRAMEWORK** | Storybook config |
| `.github/` | **FRAMEWORK** | CI/CD |
| Config files (nuxt, drizzle, eslint, etc.) | **FRAMEWORK** | All build/tool configs |

---

## Execution Plan

### Phase 1: Bulk Copy (exclude build artifacts)

Copy the entire project to the target, EXCLUDING:

```
EXCLUDE LIST:
- .git/                    # nikitat git history
- .nuxt/                   # build cache
- .nuxt-old/               # old build cache
- .nuxt-root/              # root build cache
- .output/                 # build output
- node_modules/            # dependencies (npm install fresh)
- data/sqlite.db*          # nikitat database
- .env                     # nikitat secrets
- .kilo/                   # dev tool state
- .opencode/               # dev tool state
- .tausik/                 # dev tool state
- .tausik-lib/             # git submodule
- .ralph-tui/              # dev tool state
- .idea/                   # JetBrains IDE
- playwright-report/       # test reports
- tsconfig.tsbuildinfo     # TS build cache
- .pm-deploy-state.json    # deploy state
- .deploy/                 # deploy artifacts
- portfolio-parsed.json    # nikitat portfolio data
- CODEBASE_REVIEW_PLAN.md  # nikitat-specific
- storybook-static/        # storybook build
- uploads/*                # nikitat uploaded files (keep dir + .gitkeep)
```

### Phase 2: Strip nikitat-Specific Sections

1. **Delete** `app/components/sections/SectionF22.vue`
2. **Delete** `app/components/sections/SectionFocus.vue`
3. **Delete** `app/assets/css/runtime/section-focus.css`

### Phase 3: Genericize Configuration

**`project/puppet-master.config.ts`:**

| Field | nikitat Value | Vanilla Value |
|-------|--------------|---------------|
| `pmMode` | `'build'` | `'unconfigured'` |
| `sections` | includes `f22`, `focus` | Remove `f22` and `focus` entries |
| `defaultLocale` | `'ru'` | `'en'` |
| `colors.black` | `'#3b0902'` | `'#1a1a2e'` (neutral dark) |
| `colors.white` | `'#fbf2e7'` | `'#fafafa'` (neutral light) |
| `colors.brand` | `'#901504'` | `'#4361ee'` (neutral blue) |
| `colors.accent` | `'#901504'` | `'#3a0ca3'` (neutral purple) |
| `modules.portfolio.enabled` | `true` | `true` (keep — it's a framework feature now) |
| `modules.blog.enabled` | `true` | `true` (keep — framework feature) |
| `modules.pricing.enabled` | `true` | `false` (sample only) |
| `modules.features.enabled` | `true` | `true` (keep) |
| `modules.faq.enabled` | `true` | `true` (keep) |
| `admin.websiteModules.portfolio.enabled` | `true` | `true` |
| `admin.websiteModules.faq.enabled` | `true` | `true` |
| `admin.websiteModules.features.enabled` | `true` | `true` |
| `admin.websiteModules.contacts.enabled` | `true` | `true` |
| `footerMadeBy` | fabrica22 values | **KEEP AS-IS** (developer branding) |

### Phase 4: Reset Assets to Placeholders

1. **`public/logos/`** — Replace nikitat SVGs with PM placeholder logos (simple "PM" text logos in the same naming convention)
2. **`public/images/`** — Delete `about/`, `hero/`, `frame_0019.png`. Keep directory with `.gitkeep`
3. **`public/favicon.svg`** — Replace with a generic PM favicon (simple "PM" icon)
4. **`public/og-image.png`** — Replace with a generic PM OG image
5. **`public/og-image.svg`** — Replace with a generic PM OG SVG
6. **`uploads/`** — Clear contents, keep `.gitkeep`

### Phase 5: Reset Seed Data to Generic Samples

1. **`server/database/seed-portfolio.ts`** — Strip nikitat portfolio items, replace with 3 sample portfolio items ("Sample Project 1/2/3") demonstrating the portfolio system
2. **`server/database/seed-gallery.ts`** — Strip nikitat gallery, keep empty/minimal sample
3. **`server/database/seed-content-translations.ts`** — Strip nikitat content translations, keep minimal sample translations for the generic sections
4. **`i18n/content.ts`** — Strip nikitat content, keep framework structure with sample data for en/ru locales
5. **`server/database/seed.ts`** — Keep framework seed logic (admin users, settings, features), genericize the feature seed data descriptions

### Phase 6: Clean Up Docs & Meta Files

1. **`docs/`** — Keep: `architecture/`, `contributing/`, `development/`, `entrypoints/`, `features/`, `guides/`, `operations/`, `reference/`, `releases/`, `roadmap/`, `styles/`, `portfolio-architecture.md`, `portfolio-display-modes.md`, `README.md`
2. **`docs/`** — Remove: `audit-2026-06-13.md`, `audit-2026-06-15.md`, `security-legal-audit.md`, `NEXT_CHAT_HANDOFF.md`, `plan-simplify-deploy.md`, `plans/` (nikitat-specific plans), `studies/`, `core_migration/`
3. **`CHANGELOG.md`** — Reset to empty template with "## Unreleased"
4. **`README.md`** — Genericize to "Puppet Master Framework" (remove nikitat references)
5. **`VERSION`** — Reset to `0.1.0`
6. **`legal/`** — Keep structure, replace nikitat-specific legal text with placeholder templates
7. **`.gitmodules`** — Remove (tausik submodule is dev tooling, not framework)
8. **`.env.example`** — Keep as-is (already generic with placeholder values)
9. **`AGENTS.md`** — Keep as-is (PM framework instructions)

### Phase 7: Fresh Git Init

1. `git init` in the target directory
2. `git add .`
3. `git commit -m "feat: vanilla Puppet Master framework v0.1.0"`

### Phase 8: Verification Checklist

- [ ] No nikitat-specific logos, images, or branding in `public/`
- [ ] No `SectionF22.vue` or `SectionFocus.vue`
- [ ] No `section-focus.css`
- [ ] Config has `pmMode: 'unconfigured'`
- [ ] Config sections only contain generic PM sections (home, about, contact, portfolio)
- [ ] Config colors are neutral PM defaults
- [ ] Config `defaultLocale` is `'en'`
- [ ] Seed data contains only generic sample content
- [ ] No `.env` file (only `.env.example`)
- [ ] No `data/sqlite.db`
- [ ] No `node_modules/`
- [ ] No `.nuxt/`
- [ ] `madebylogos/` preserved untouched
- [ ] Portfolio system fully intact (components, API, admin, seed data)
- [ ] All generic sections render with sample i18n keys
- [ ] `npm install && npm run db:push && npm run db:seed && npm run dev` would work
- [ ] `docs/` contains only PM framework docs

---

## Dependency Graph

```
Phase 1 (Copy) ──→ Phase 2 (Strip sections)
                ──→ Phase 3 (Genericize config)    ──→ Phase 7 (Git init)
                ──→ Phase 4 (Reset assets)          ──→ Phase 8 (Verify)
                ──→ Phase 5 (Reset seed data)
                ──→ Phase 6 (Clean docs)
```

Phases 2-6 are independent and can run in parallel after Phase 1.
Phase 7 depends on all of 2-6.
Phase 8 depends on 7.

---

## Risk Assessment (ISO 25010)

| Dimension | Risk | Notes |
|-----------|------|-------|
| Functional Suitability | ✅ Low | All PM features preserved, only project content stripped |
| Reliability | ✅ Low | No code logic changes, only config/content |
| Performance | ✅ Low | No architectural changes |
| Usability | ✅ Low | Init wizard flow preserved for new projects |
| Security | ✅ Low | No secrets copied, encryption keys placeholder |
| Compatibility | ✅ Low | Same dependency tree |
| Maintainability | ✅ Low | Cleaner codebase without project-specific cruft |
| Portability | ✅ Low | Same Docker/deploy system |

---

## Anti-Pattern Check

- ✅ No Distributed Monolith risk (single deployment)
- ✅ No Cargo Cult (keeping proven patterns from nikitat)
- ✅ No Premature Optimization (vanilla is intentionally simple)
- ✅ No Vendor Lock-in (PM is self-hosted)

---

## ADR-001: Portfolio System Inclusion

### Status: Accepted

### Context
The portfolio system was developed during the nikitat project and is now mature. It includes portfolio items, galleries, case studies, filtering, admin management, and display modes.

### Decision
Include the portfolio system as a core PM framework module in the vanilla version.

### Options Considered
1. **Include as core module** — Portfolio is enabled by default, with sample data ✅ CHOSEN
2. **Include but disabled** — Portfolio exists but `enabled: false`
3. **Exclude entirely** — Remove portfolio code from vanilla

### Consequences
- Portfolio is immediately available to new PM projects
- Sample portfolio items demonstrate the system's capabilities
- No additional setup needed — just populate with real content via admin panel

---

## ADR-002: Section Removal Strategy

### Status: Accepted

### Context
`SectionF22` and `SectionFocus` are nikitat-specific. Other sections (Hero, About, Contact, etc.) are generic.

### Decision
Remove `SectionF22.vue`, `SectionFocus.vue`, and `section-focus.css`. Keep all other sections.

### Options Considered
1. **Remove both** — Clean vanilla without project-specific sections ✅ CHOSEN
2. **Keep as examples** — Rename to SectionShowcase/SectionServices
3. **Move to docs** — Archive as example section implementations

### Consequences
- Vanilla has clean, generic sections only
- Developers create project-specific sections from scratch
- Example section creation is documented in config comments and docs
