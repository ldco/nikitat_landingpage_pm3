# Layer 2 — Architecture & Stack-Direction Validation Findings

> **Audit type:** READ-ONLY code inspection — no files modified.
> **PM3 path:** `nikitat/app/` (SvelteKit 2 + Svelte 5)
> **PM2 reference:** `nikitat/app-nuxt/` (Nuxt 4 + Vue 3)
> **Date:** 2026-08-10

---

## 1. Stack Assessment

### 1.1 SvelteKit 2 + Svelte 5 Runes vs Nuxt 4 + Vue 3

**Verdict: Aligned**

Runes (`$state`, `$derived`, `$effect`) are a clear improvement over Vue's `ref()`/`reactive()`/`computed()`/`watch()` for AI-agent-driven development:

| Criterion | Svelte 5 Runes | Vue 3 Reactivity | AI Win |
|---|---|---|---|
| Reactivity declaration | `let x = $state(0)` — single keyword | `ref(0)`, `reactive({})`, `computed()` — multiple APIs | Runes are simpler to pattern-match |
| Derived values | `const doubled = $derived(x * 2)` — declarative | `computed(() => x.value * 2)` — requires `.value` | No `.value` unwrapping noise |
| Side effects | `$effect(() => { ... })` — auto-tracks deps | `watch(x, ...)`, `watchEffect(...)` — explicit deps | Auto-dependency tracking reduces boilerplate |
| Props | `let { data } = $props()` — native destructure | `defineProps<{ data }>()` — runtime macro | Runes are pure TS, no magic |
| Static analysis | True variables — grep/parse as normal TS | `.value` access requires AST awareness | Easier for AI to trace data flow |
| Compiler guarantees | Compiler enforces rune rules at build time | Runtime proxy-based, no compile-time checks | Earlier error detection |

**Observation:** In PM3's `+page.svelte:14-18`, derived values cleanly express intent:
```ts
const sections = $derived(
  HOMEPAGE_SECTIONS.filter(s => s.id !== 'hero' && s.enabled && s.renderMode !== 'page')
)
```
This is 4 lines with zero `.value` noise — an AI reading this immediately understands the filtering logic.

**Caveat:** `$inspect` is available but not yet widely used in the codebase.

---

### 1.2 Tailwind v4 — Token-Reference Bracket Syntax

**Verdict: Aligned**

Token enforcement is **real and comprehensive**. The `scripts/pm3-validator.mjs` (675 lines) implements 10 distinct checks:

| Check | Rule | What it blocks |
|---|---|---|
| #1 | Duplicate tokens | `--color-pm-brand` defined twice in `@theme` |
| #2 | Forbidden `@utility` | New utility classes beyond `min-h-dvh`, `backdrop-blur-glass` |
| #3 | Unjustified `@layer components` | Any rule without "why inline is impossible" comment |
| #4 | Forbidden arbitrary brackets | `text-[14px]`, `max-w-[800px]`, literal colors in `[]` |
| #5 | Literal duplication (2+) | Same raw value appearing twice — promote to token |
| #6 | Canonical primitive bypass | Hand-rolled button/container/heading class bundles |
| #7 | Type suppressions | `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, `!` |
| #8 | Empty catch blocks | `catch { }` with no logging/re-throw |
| #9 | Missing Zod on APIs | POST/PUT/PATCH without Zod import |
| #10 | New untranslated string literals | ANY literal not in frozen baseline |

**Comparison to PM2's BEM CSS:**

| Dimension | PM3 (Token brackets) | PM2 (BEM CSS) | AI Advantage |
|---|---|---|---|
| Class names | `h-[var(--h-header)]` | `.header { height: 60px; }` | Bracket form is self-documenting inline |
| Token lookup | `docs/design-tokens.md` (231 lines) | `app/assets/css/` (5-layer BEM) | Single reference doc vs scattered files |
| Enforcement | Automated (validator) | Manual review | Machine-enforced consistency |
| Rebranding | Change 4 primitives in `theme.css` | Regenerate CSS variables | 4-line rebrand vs full passthrough |
| New component | Use existing tokens, no new CSS | Write BEM class in CSS file | No separate CSS file required |

**Bottom line:** PM3's approach is **strictly more AI-friendly**. An AI agent reads a component and sees the exact token in brackets — no need to cross-reference a separate CSS file. The validator prevents drift.

**Caveat:** The validator only runs on staged files via `lint-staged`. A full-repo validation command exists but is not part of the standard workflow.

---

### 1.3 Drizzle ORM — Schema-as-Code

**Verdict: Aligned-with-caveats**

Both projects use Drizzle ORM with SQLite. PM3 schema lives at `src/lib/server/db/schema.ts` (single file, 31 tables per AGENTS.md). PM2 at `server/database/schema.ts`.

| Dimension | PM3 | PM2 |
|---|---|---|
| Config file | `drizzle.config.ts` | `drizzle.config.ts` |
| Schema location | `src/lib/server/db/schema.ts` | `server/database/schema.ts` |
| Seed | `src/lib/server/db/seed.ts` | `server/database/seed.ts` |
| Dialect | `sqlite` | `sqlite` |
| Strict mode | Not configured | `strict: true` |
| Migration output | `./drizzle` | `./server/database/migrations` |

**Caveat:** PM3's `drizzle.config.ts` lacks `strict: true` and `verbose: true` that PM2 uses. This is a minor regression — strict mode catches schema-drift at generation time. PM3 also uses `drizzle-kit push` (no migration files) while PM2 uses `drizzle-kit generate` + `migrate`. For AI agents, migration files provide an auditable history of schema changes. The push-only approach means schema history is implicit in the current schema.ts diff.

---

### 1.4 Paraglide i18n vs @nuxtjs/i18n

**Verdict: Aligned-with-caveats**

PM3 uses `@inlang/paraglide-sveltekit` (compile-time i18n) vs PM2's `@nuxtjs/i18n` (runtime). Configuration is in `project.inlang/settings.json`:
- Source language: `ru`
- Target languages: `en`, `fr`, `he`
- Message files: `messages/{languageTag}.json`

The **i18n literal baseline** enforcement (`scripts/i18n-literal-baseline.json`, 104 lines) is a notable architectural choice:

| Aspect | Detail |
|---|---|
| Baseline size | 104 lines covering ~20 files |
| Status | Technical debt — admin page labels frozen, awaiting translation |
| Policy | Baseline must only SHRINK, never grow (`docs/contributing/i18n-literals-policy.md` line 29-31) |
| Regeneration | Code-review-gated (`--update-baseline`) |
| Allowed exceptions | Numbers/punctuation, single-letter marks, i18n keys, URLs, locale codes, PascalCase identifiers |

**The baseline file tracks strings like:**
- `"Dashboard"`, `"Users"`, `"Published"`, `"Draft"` — admin UI labels frozen since before the rule existed
- `"Puppet Master"` — brand name in `MadeWith.svelte`
- `"Story"` — in `OnepagerThreeStoryScene.svelte`

**Caveat:** The baseline is a frozen inventory of *untracked technical debt*. Every entry there is a string that SHOULD be an i18n key but wasn't when the rule was introduced. An AI agent that sees a string in `i18n-literal-baseline.json` might mistakenly treat it as "approved" rather than "pending translation." The policy doc clarifies this but it's a subtle distinction.

**Comparison:**
- PM2: `@nuxtjs/i18n` — runtime i18n with `t()` function, no literal enforcement
- PM3: Paraglide — compile-time i18n + automated literal regression detection

Paraglide's compile-time approach means missing translations are caught at build time rather than runtime, which is better for AI agents that might forget to add a key.

---

### 1.5 Zod v4 Validation

**Verdict: Aligned**

Zod v4 is used **consistently** across all API routes. Verified in 4 routes:

| Route | Schema | Method | Pattern |
|---|---|---|---|
| `api/contact/submit/+server.ts` | `contactSchema` (name, email, message, consent) | POST | `safeParse` + `error(400)` |
| `api/auth/login/+server.ts` | `loginSchema` (email, password) | POST | `safeParse` + `error(400)` |
| `api/admin/faq/+server.ts` | `createSchema` (slug, category, published, order) + `paginationSchema` (GET) | POST, GET | Zod on both GET params and POST body |
| `api/user/change-password/+server.ts` | `changePasswordSchema` (currentPassword, newPassword) | PUT | `safeParse` + `error(400)` |

All 4 routes follow the identical pattern:
```ts
const parsed = schema.safeParse(body)
if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
// or: return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
```

The PM3 validator check #9 enforces this: any `+server.ts` under `src/routes/api/` with a POST/PUT/PATCH/DELETE handler must import Zod. There are **55 API route files** — the validator catches any that omit validation.

**Observation:** PM3 is more thorough than PM2 here. PM2's README says "Validate inputs with Zod" but has no automated enforcement. PM3 has a machine-enforced rule.

---

### 1.6 sveltekit-superforms

**Verdict: Reconsider**

`sveltekit-superforms` (v2.30.2) is in `package.json` as a dependency but has **zero usage** across the codebase:

```
grep "superforms|superForm" src/routes/admin/ → No results
```

All admin forms use SvelteKit's native form actions with manual Zod `safeParse` + `fail()`:

```ts
// src/routes/admin/blog/create/+page.server.ts:18-20
const parsed = createSchema.safeParse({ slug: form.get('slug') })
if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
```

**This is a dead dependency.** Either:
1. Adopt superforms for admin CRUD (it handles client-side validation, progressive enhancement, and form state automatically — each of which an AI agent would otherwise need to implement manually), OR
2. Remove it from dependencies to avoid confusion.

For AI-agent-driven development, superforms is valuable because it:
- Auto-generates client-side validation from Zod schemas
- Handles `$form`, `$errors`, `$constraints` stores automatically
- Eliminates boilerplate for every admin form

**Recommendation:** Adopt superforms OR remove it. Having it as a dead dependency creates ambiguity for AI agents reading the codebase.

---

### 1.7 Vitest Testing

**Verdict: Aligned**

Both projects use Vitest v3.2.0. PM3 has 10 test files in `tests/`:

| Test file | Area |
|---|---|
| `section-content.test.ts` | Routes |
| `admin-pages.test.ts` | Utils |
| `content-store.test.ts` | Stores |
| `section-registry.test.ts` | Components |
| `admin/meta.test.ts` | Routes |
| `admin/portfolios.test.ts` | Routes |
| `titleBreaker.test.ts` | Utils |
| `navigation.test.ts` | Utils |
| `features.test.ts` | Config |
| `site.test.ts` | Config |

**Comparison to PM2:**
- PM2 has significantly more tests (unit, API, e2e, Playwright)
- PM3 has no API integration tests, no e2e tests
- PM3's test coverage is focused on config/component contracts, not API behavior
- PM3's `section-registry.test.ts` is a notable innovation: it reads source files as text and asserts structural contracts (e.g., "no hardcoded component-name dispatch in SectionRenderer")

**Caveat:** PM3's test suite is thin. For AI-driven development, more comprehensive tests (especially API integration tests) would serve as guardrails against regressions.

---

## 2. Framework/Project Boundary

### 2.1 Two-Layer Model Assessment

The boundary defined in `docs/framework-project-boundary.md` (80 lines) is **architecturally sound**:

```
src/                     ← FRAMEWORK (reusable, never edited per-site)
└── project/             ← PROJECT (site identity, owned by site)
```

**What the framework provides:**
- Components (atoms, molecules, complex, sections) — all config-driven
- Stores (theme, content, settings, admin, navigation)
- Actions (reveal, scrollHeader, scrollSpy, etc.)
- Server (DB, auth, security, storage, email, telegram, audit)
- Routes (all pages)
- Config types + helpers
- CSS structural tokens
- i18n UI strings

**What the project provides:**
- `theme.css` — 4 brand primitives (`--p-brand`, `--p-black`, `--p-white`, `--p-accent`)
- `site-config.ts` — locales, nav, sections, modules, features, admin, logo
- `content.json` — all site text
- `SectionF22.svelte`, `FallingLetters.svelte`, `HeroParallaxScene.svelte` — brand components
- `registry.ts` — component override registry
- Brand assets in `public/`

### 2.2 Cross-Boundary Import Analysis

5 cross-boundary imports found (all framework → project):

| File | Imports from | Purpose | Approved? |
|---|---|---|---|
| `src/lib/config/site.ts:129-130` | `../../project/site-config` | Assembling project config values | Yes — documented design |
| `src/lib/components/sections/registry.ts:24` | `../../../project/registry` | Merging PROJECT_SECTIONS | Yes — ADR-003 |
| `src/lib/components/sections/SectionHero.svelte:10` | `../../../project/HeroParallaxScene.svelte` | Brand component | ⚠️ Debated |
| `src/lib/components/sections/SectionHero.svelte:11` | `../../../project/gsapIntro` | Brand animation utility | ⚠️ Debated |

**Issue with SectionHero → project imports:** `SectionHero.svelte` lives in `src/lib/components/sections/` (framework layer) but imports `HeroParallaxScene` and `gsapIntro` from `src/project/`. This is a **documented exception** — the section needs project-specific parallax effects that can't be abstracted. However, it creates a tight coupling: the `SectionHero` framework component **cannot be reused** in another PM3 project without either:
1. Creating a `HeroParallaxScene` in the new project's `src/project/`
2. Removing the import and falling back to no parallax

The `FEATURES.heroParallax` flag gates this (`SectionHero.svelte:29`):
```ts
const parallaxEnabled = $derived(FEATURES.heroParallax)
```
If `heroParallax: false`, the project import is never rendered — but it's still imported at the module level, meaning the file must exist.

**No framework files import from `src/project/` outside these documented cases.** The boundary is clean elsewhere.

### 2.3 SectionRenderer Architecture

`SectionRenderer.svelte` (59 lines) resolves components via:
1. Finds the section config from `HOMEPAGE_SECTIONS` by `sectionId`
2. Resolves the component from `SECTION_REGISTRY[section.component]`
3. Builds props via `buildSectionProps(component, content)`
4. Renders `<Comp {...sectionProps} />`

**Key design decisions:**
- **No component-name dispatch** — no `if (component === 'SectionX')` branches. This means adding a new section never requires editing `SectionRenderer`.
- **Project sections receive `{}` props** by default (the adapter's `default: return {}`). The adapter only maps data-backed framework sections.
- **SectionHero excluded** — rendered directly by `Onepager.svelte` because it needs a special grid layout.
- **Test-enforced** — `tests/lib/components/section-registry.test.ts` asserts no hardcoded component names in the renderer source.

### 2.4 `@puppet-master/core` Package Boundary

The boundary doc mentions a future `@puppet-master/core` npm package (`npm update @puppet-master/core`). This is **aspirational** — currently there is no package extraction. The framework and project share the same `src/` tree. The 2-layer boundary is enforced by convention + code review, not by package boundaries.

**Risk for AI agents:** An AI unfamiliar with the convention might add a framework component that imports from `src/project/` without realizing it breaks the boundary. The section-registry.test.ts catches the specific pattern of naming project components in the renderer, but there's no general "no framework→project imports" lint rule.

---

## 3. AI Agent Tooling Maturity

### 3.1 AGENTS.md

**Rating: Comprehensive (106 lines)**

`AGENTS.md` covers:
- Stack identity (SvelteKit + Tailwind PM3)
- Project-specific colors and config
- Database and commands
- i18n literal enforcement policy
- Canonical primitives table (6 patterns, non-bypassable)
- Visual system rules (3 sub-rules)
- Architecture rules (4 sub-rules)
- Data & behavior rules (4 sub-rules)
- Enforcement rules (2 sub-rules)
- AI development rules (6 sub-rules)

**Strengths:**
- Actionable — "never hand-roll button classes" vs "use `<CtaButton>`"
- Cross-references to detailed docs (`docs/contributing/canonical-primitives.md`)
- Lists what the validator blocks (Rule D.12)
- Entity template approach (blog as canonical example)

**Gap:** Does not mention the `heroParallax` flag behavior or the SectionHero → project import pattern. An AI agent building a new PM3 site might not realize the Hero project dependency exists.

### 3.2 docs/contributing/ Directory

| File | Purpose |
|---|---|
| `adding-a-new-entity.md` | 7-step guide with blog as reference entity |
| `canonical-primitives.md` | Non-bypassable primitive registry (7 patterns) |
| `framework-parity-determinations.md` | PM2→PM3 feature parity decisions |
| `i18n-literals-policy.md` | No-untranslated-regressions enforcement |
| `pm-v3-style-rules.md` | Full PM3 style rule set |
| `pm3-rules-evaluation.md` | Evaluation of rule adherence |
| `v2-v3-token-mapping.md` | Token migration reference |

**Rating: Comprehensive.** The entity guide is particularly valuable for AI agents — it provides a checklist-driven approach that prevents missing steps.

### 3.3 Pre-Commit Enforcement (validator + hooks)

The enforcement chain:

```
git commit
  → .husky/pre-commit
    → Global secrets-scanning hook
    → npx lint-staged
      → node scripts/pm3-validator.mjs  (10 checks)
      → eslint --max-warnings=0
```

**PM3 Validator checks (10 total):**

| # | Check | Enforcement |
|---|---|---|
| 1 | Duplicate tokens in `@theme` | Error |
| 2 | New `@utility` additions | Error (only 2 allowed) |
| 3 | Unjustified `@layer components` | Error (requires comment) |
| 4 | Forbidden bracket values | Error (literal px/colors/rem) |
| 5 | Literal duplication (2+) | Warning (promote to token) |
| 6 | Canonical primitive bypass | Error |
| 7 | Type suppressions + `!` | Error |
| 8 | Empty catch blocks | Error |
| 9 | Missing Zod on API mutations | Error |
| 10 | NEW untranslated string literals | Error (baseline-gated) |
| 10b | NEW label-like strings in TS config | Error (baseline-gated) |

**ESLint rules:**
- `@typescript-eslint/ban-ts-comment`: ERROR — no `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`
- `@typescript-eslint/no-non-null-assertion`: WARN — no `!`
- `ssr-safety/no-direct-config-access`: WARN (but this is a PM2/Nuxt leftover — it checks for `puppet-master.config` patterns that don't exist in PM3)
- Svelte 5 runes (`$state`, `$derived`, etc.) are declared as `readonly` globals

**The `eslint-plugin-ssr-safety.js`** (161 lines) is a **PM2 artifact**: it checks for direct `puppet-master.config` imports in Vue files, looking for paths like `~/puppet-master.config`. This plugin was NOT rewritten for PM3/SvelteKit. It's included in the ESLint config but its pattern matches don't apply to Svelte files (`filename.endsWith('.vue')` check). **Verdict: Dead code in PM3 context — should be removed or rewritten.**

### 3.4 i18n Literal Baseline

`scripts/i18n-literal-baseline.json` (104 lines) tracks 20 files with frozen literals. The tracked files are predominantly **admin pages** (17 of 20) where admin UI labels haven't been translated yet. Only 3 non-admin files have frozen literals.

This is a **progressive enforcement mechanism**: new code is held to the standard, while existing untranslated strings are acknowledged as technical debt that must be chipped away.

### 3.5 Tooling Summary

| Tool | Maturity | Notes |
|---|---|---|
| AGENTS.md | Excellent | 106 lines, actionable, cross-referenced |
| docs/contributing/ | Excellent | 7 docs covering all major concerns |
| pm3-validator.mjs | Excellent | 675 lines, 10+1 checks, machine-enforced |
| ESLint config | Good | Strong TS rules, but carries PM2 dead code |
| Pre-commit hook | Good | Chains global secrets + lint-staged |
| i18n baseline | Innovative | Progressive enforcement of no-regressions |
| **Missing** | — | No CI pipeline config (.github/workflows), no automated full-repo validator run |

---

## 4. Component Architecture

### 4.1 Directory Structure

```
src/lib/components/
├── atoms/       (25 components)
├── molecules/   (19 components)
├── complex/     (9 components)
└── sections/    (12 components)
```

### 4.2 Hierarchy Verification

| Layer | Count | Responsibility | Verified? |
|---|---|---|---|
| `atoms/` | 25 | Single responsibility, no children | ✓ |
| `molecules/` | 19 | Compose atoms, may hold state | ✓ |
| `complex/` | 9 | Page regions composing molecules+atoms | ✓ |
| `sections/` | 12 | Full-viewport regions with `id` for anchor nav | ✓ |
| `plugins/` | 0 | Project overrides (not used yet) | N/A |

### 4.3 Cross-Section Imports

Sections are self-contained. No section imports from another section. The only cross-layer imports are:
- All sections import from `atoms/` and `molecules/` (by design)
- `SectionHero.svelte` imports from `../../../project/` (documented exception)

### 4.4 Section → Registry Completeness

| Section | In Registry? | In HOMEPAGE_SECTIONS? | Notes |
|---|---|---|---|
| SectionHero | **NO** | YES | Rendered directly by Onepager |
| SectionAbout | YES | YES | Framework section |
| SectionFocus | YES | YES | Framework section |
| SectionF22 | YES (project) | YES | Project section via registry |
| SectionPortfolio | YES | YES | Data-backed |
| SectionContact | YES | YES | Framework section |
| SectionBlog | YES | YES | Data-backed |
| SectionFeatures | YES | YES | Data-backed |
| SectionFaq | YES | YES | Data-backed |
| SectionPricing | YES | YES | Data-backed |
| SectionTeam | YES | YES | Data-backed |
| SectionTestimonials | YES | YES | Data-backed |
| SectionClients | YES | YES | Data-backed |

SectionHero's absence from the registry is **by design** — documented in `tests/lib/components/section-registry.test.ts:52-56`:
> SectionHero is the documented exception: Onepager renders it directly because it needs a grid layout incompatible with the Section shell.

**This is a potential trap for AI agents.** An agent that adds `SectionHero` to the registry to "fix" the missing entry would create a rendering conflict (Onepager renders it directly AND SectionRenderer would try to render it). The test guards against this by asserting Hero is excluded.

---

## 5. Config-Driven Architecture

### 5.1 `src/project/site-config.ts` Analysis

The config file (219 lines) is comprehensive:

| Section | Lines | Purpose |
|---|---|---|
| Locales | 29 | 4 locales (ru, en, fr, he), ISO codes, display names |
| Navigation | 9 | 6 nav items (home, about, focus, f22, contact, portfolio) |
| Homepage Sections | 8 | 6 sections with component, renderMode, enabled flags |
| SEO | 5 | Title, description, keywords (all i18n keys) |
| Contact | 1 | Email address |
| Footer "Made by" | 7 | Branding config (text, URL, logos, language fallback) |
| Modules | 74 | 8 modules with per-module config (portfolio, blog, pricing, faq, features, team, testimonials, clients, contact) |
| Features | 28 | 27 feature flags (all boolean except width modes and transitions) |
| Admin | 24 | System + website module admin config with role-based access |
| Logo | 8 | Logo paths, shapes, language fallbacks |
| Theme | 1 | Default theme (system) |
| PM Mode | 1 | Build/develop/unconfigured |
| Entities | 1 | website: true, app: false |

### 5.2 Feature Flag Usage

`FEATURES` is imported in:
- `+page.svelte:5` — `FEATURES.onepager` gates the onepager rendering
- `SectionHero.svelte:29` — `FEATURES.heroParallax` gates parallax rendering
- `api/contact/submit/+server.ts:7,45,51` — `FEATURES.contactTelegramNotify` and `FEATURES.contactEmailConfirmation` gate notifications
- `api/auth/login/+server.ts:65` — `FEATURES.twoFactorAuth` gates 2FA flow

All feature flags are properly centralized. No hardcoded `if (true)` or `if (false)` found.

**Notable:** `PM_MODE` is set to `'build'` in `site-config.ts:215` but AGENTS.md says `'develop'`. This discrepancy between documentation and actual config could confuse an AI agent. Likely the file was last saved in build mode and the AGENTS.md description is the intended default.

### 5.3 Module Config Completeness

All 8 module configs follow the same pattern:
```ts
moduleName: {
  enabled: boolean,
  config: { /* module-specific options */ }
}
```

Disabled modules (team, testimonials, clients, contact) still have full configs — they're feature-flagged, not removed. This means re-enabling a module is a one-line change (`enabled: true`).

---

## 6. Data Flow Assessment

### 6.1 Server → Component Trace

```
+layout.server.ts (global data)
  ├── contentTranslations → content store → t() helper
  ├── publicSettings → settings store
  └── legalDocuments → footer

+page.server.ts (page data)
  └── sectionContent: loadSectionContent(locale)
      └── Returns typed SectionContent

+page.svelte
  ├── let { data } = $props()
  ├── sections = $derived(HOMEPAGE_SECTIONS.filter(...))
  └── <Onepager sections={sections} content={data.sectionContent} />

Onepager.svelte
  ├── <SectionHero /> (rendered directly, reads t() from store)
  └── {#each sections}
      └── <SectionRenderer sectionId={section.id} content={content} />

SectionRenderer.svelte
  ├── section = $derived(HOMEPAGE_SECTIONS.find(s => s.id === sectionId))
  ├── Component = $derived(SECTION_REGISTRY[section.component])
  ├── props = $derived(buildSectionProps(component, content))
  └── <Comp {...props} />

Section (e.g., SectionPortfolio)
  └── let { items }: { items: PortfolioItemCard[] } = $props()
```

### 6.2 Type Safety

The data flow is **fully typed end-to-end**:
1. `loadSectionContent()` returns `SectionContent` (typed struct)
2. `SectionRenderer` receives `SectionContent` (no cast)
3. `buildSectionProps()` maps component name → typed props slice
4. Section components receive typed props via Svelte 5 `$props()`

No `Record<string, unknown>` casts at component boundaries. No `as` type assertions.

### 6.3 Content Store Approach

Global content is served via stores, not per-component fetches:
- `content.svelte` — provides `t(key, fallback?)` function
- Initialized from `contentTranslations` loaded in `+layout.server.ts`
- Components call `t('hero.title', t('sections.hero'))` for text

This is AI-friendly: an agent doesn't need to trace API calls to find where text comes from — it's always `t('key')`.

### 6.4 Locale Handling

- Locale comes from `locals.paraglide.lang` in layout load
- Passed to `getSanitizedContentTranslations(locale)` and `loadSectionContent(locale)`
- Section content includes `locale: string` in `SectionContent`
- Paraglide's `languageTag()` is used in components for client-side locale detection

---

## 7. Top 5 Architectural Risks

### Risk 1: `sveltekit-superforms` Dead Dependency (Medium)

`superforms` is in `package.json` but not used anywhere. Admin forms use manual Zod + `fail()`. This creates confusion for AI agents — they might try to import it or assume it's part of the form pattern. The dependency should be either adopted or removed. The manual approach is functional but verbose; adopting superforms would reduce boilerplate per form by ~60%.

### Risk 2: PM2 Artifacts in ESLint Config (Low-Medium)

`eslint-plugin-ssr-safety.js` is a PM2/Nuxt-specific plugin that checks for `puppet-master.config` imports in Vue files. It's dead code in PM3 (only applies to `.vue` files). An AI agent reading the ESLint config might be confused by this plugin's presence and try to follow its rules for Svelte files.

### Risk 3: SectionHero Circular Dependency (Medium)

`SectionHero.svelte` (framework layer) imports from `src/project/` (`HeroParallaxScene`, `gsapIntro`). This breaks the clean framework→project boundary. While gated by `FEATURES.heroParallax`, the module-level import means the project files must always exist. For a new PM3 site with `heroParallax: false`, the project must still provide at least a stub file. This coupling means `SectionHero` is NOT a pure framework component — it's a hybrid.

### Risk 4: SectionHero Not-in-Registry Exception (Medium)

`SectionHero` is the ONLY section referenced in `HOMEPAGE_SECTIONS` that is NOT in `SECTION_REGISTRY`. It's rendered directly by `Onepager.svelte` instead of through `SectionRenderer`. An AI agent that:
- Adds SectionHero to the registry to "fix" the asymmetry → double-render
- Removes SectionHero from HOMEPAGE_SECTIONS → section disappears
- Changes Onepager to use SectionRenderer for Hero → breaks grid layout

The documented exception in the test file is the only place this is explained. AGENTS.md doesn't mention it.

### Risk 5: PM_MODE Config-Doc Discrepancy (Low)

`site-config.ts` sets `PM_MODE: 'build'` but AGENTS.md says `'develop'`. This is likely just a saved-vs-intended mismatch, but for an AI agent reading both files, it creates ambiguity about the intended operating mode. In develop mode, the DB is seeded with test data; in build mode, certain admin routes may behave differently.

---

## Summary

| # | Finding | Severity | Action |
|---|---|---|---|
| 1 | Svelte 5 runes clearly superior to Vue reactivity for AI codegen | **Positive** | — |
| 2 | Token-reference bracket syntax + pm3-validator = production-grade enforcement | **Positive** | — |
| 3 | Paraglide compile-time i18n + literal baseline = strong AI guardrail | **Positive** | — |
| 4 | Zod v4 used consistently across all 55 API routes, enforced by validator | **Positive** | — |
| 5 | `sveltekit-superforms` in deps but unused — dead code | **Medium** | Adopt or remove |
| 6 | `eslint-plugin-ssr-safety.js` is PM2-specific, dead in PM3 | **Low-Medium** | Remove or rewrite |
| 7 | `SectionHero.svelte` imports from `src/project/` — breaks framework purity | **Medium** | Extract parallax via injection or make Hero a project component |
| 8 | SectionHero not in registry but in HOMEPAGE_SECTIONS — undocumented exception | **Medium** | Document in AGENTS.md |
| 9 | Drizzle `push`-only (no migration files) vs PM2's generate+migrate | **Low** | Consider adopting migrations |
| 10 | `PM_MODE` set to `build` in source but AGENTS.md says `develop` | **Low** | Align config with docs |
| 11 | Test coverage thin — no API integration or e2e tests | **Medium** | Add integration test suite for AI guardrails |
| 12 | No CI pipeline config found | **Low** | Consider adding GitHub Actions for validator + test automation |
| 13 | Component architecture clean, 4-layer hierarchy with 65 components | **Positive** | — |
| 14 | Config-driven architecture with 27 feature flags, 8 modules — no hardcoded flags | **Positive** | — |
| 15 | Data flow fully typed end-to-end (SectionContent → buildSectionProps → typed component props) | **Positive** | — |

**Overall assessment:** PM3's architecture is significantly more AI-agent-friendly than PM2. The combination of compile-time i18n, automated token enforcement, typed section contracts, and config-driven rendering means an AI agent can make changes with high confidence that violations will be caught. The main risks are around the SectionHero coupling and a few dead dependencies/artifacts that could mislead agents.
