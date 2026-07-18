# /vanilla — Strip Project to Vanilla PM Framework

Use the agent's intelligence to identify and remove ALL client-project code, leaving only PM framework baseline. The agent analyzes the project against framework knowledge — no hardcoded file lists.

## Usage

```
/vanilla
```

## Agent Methodology

### Phase 1 — Load Framework Baseline
1. Run `pm_knowledge topic=all` to load the canonical PM framework reference.
2. Run `pm_knowledge_entrypoint mode=greenfield` to understand what a fresh project should contain.
3. Run `pm_config_get` to understand current project state.

### Phase 2 — Identify Client vs Framework
Use these heuristics to classify everything as FRAMEWORK (keep) or CLIENT (remove):

**FRAMEWORK signals (KEEP):**
- File exists inside `pm-core/`
- File is in `public/puppetmaster/` or `public/madebylogos/`
- File is `server/database/schema.ts` (Drizzle schema = framework)
- File is `i18n/system-seed.json` (system UI strings)
- File is `i18n/system.ts`, `i18n/loader.ts`, `i18n/i18n.config.ts`
- Component is in `app/components/atoms/`, `app/components/molecules/`, `app/components/organisms/`
- Section matches standard PM module components: Hero, Features, FAQ, Contact, Blog, Pricing, Portfolio, Team, Testimonials, Clients
- Page is in `app/pages/admin/` or a framework-standard page (index.vue, login.vue, init.vue, legal/)
- CSS is in `app/assets/css/` (the global layer system)
- Script is in `scripts/` (framework tooling)
- File is `.env.example`, `Dockerfile`, `ansible/`, `docs/` (infrastructure)

**CLIENT signals (REMOVE):**
- File path contains client-specific names (project name, brand name, owner name)
- Section not in the 10 standard PM module components
- CSS file in `app/assets/css/runtime/` (runtime overrides = client)
- Image in `public/images/` (client uploaded assets)
- Favicon/og-image in `public/` that differs from PM defaults
- Logo variant in `public/logos/` with non-English locale suffix (`_ru`, `_fr`, `_he`)
- Translation content in `i18n/content.ts` that's not framework demo data
- Concept doc in `project/init/concept_docs/` not named `README.md`
- Generated file in `project/init/generated/`
- Config backup files (`*.backup.*`)
- `data/sqlite.db` + WAL + SHM (client database content)

### Phase 3 — Smart Removal
For each identified CLIENT file:
1. Verify it's not referenced by any framework code before removing.
2. Remove the file.
3. If it's a compiled/generated artifact (`.nuxt`, `.output`), remove the whole directory.

### Phase 4 — Reset Configuration
Use `pm_config_set` to reset client-customized values to PM defaults:
```
pm_config_set key="pmMode" value="unconfigured"
pm_config_set key="colors.black" value="#2f2f2f"
pm_config_set key="colors.white" value="#f0f0f0"
pm_config_set key="colors.brand" value="#aa0000"
pm_config_set key="colors.accent" value="#0f172a"
pm_config_set key="defaultLocale" value="en"
```
Then manually edit `project/puppet-master.config.ts` to:
- Strip locales array to `[{ code: 'en', iso: 'en-US', name: 'English' }]`
- Reset `footerMadeBy` to PM defaults (url: '/', logoAlt: 'Puppet Master')
- Reset sections to `home, features, faq, contact`
- Reset features to framework defaults (only onepager + interactiveHeader + doubleTheme + multiLangs)
- Disable all modules except features + faq (demo)
- Reset admin RBAC to standard defaults

### Phase 5 — Regenerate Essentials
- Copy `.env.example` → `.env`, set `PM_MODE=unconfigured`
- Write empty `i18n/content.ts`: `export function getContentSeedData() { return [] }`
- Create empty `data/` directory with `.gitkeep`
- Delete `.nuxt`, `.nuxt-old`, `.nuxt-root`, `.output` caches

### Phase 6 — Verify
Run a quick sanity check:
- `pm-core/` directory still exists
- `server/database/schema.ts` still exists
- Framework sections (SectionHero, SectionFeatures, SectionFaq, SectionContact) still exist
- No client section files remain
- Config has `pmMode: 'unconfigured'`

## After completion
```bash
npm install
npm run dev
# Open http://localhost:3000/init
```
