# PuppetMaster Shop — Building an E-commerce Framework on PM3

> **Document purpose.** This is the build guide for turning the current Puppet Master v3
> (PM3) codebase — a config-driven SvelteKit 5 CMS/onepager framework, whose current
> *instance* is the **FABRICA22** design-studio landing page — into **PuppetMaster Shop**,
> a reusable e-commerce framework.
>
> The plan: **clone this repo → strip the FABRICA22/landing surface (§3) → rebrand the
> project seam (§2) → build the shop domain (products/cart/orders) on top of the kept
> framework core (§4) → verify (§5).**
>
> Repo facts verified on 2026-09-08: SvelteKit 5 + Svelte 5 runes, Tailwind CSS v4,
> Drizzle ORM on SQLite (better-sqlite3), Paraglide i18n, 33 DB tables, 4 locales
> (ru/en/fr/he), PM_MODE `'build'`, onepager `true`, 2FA `true`.

---

## 0. TL;DR

| Question | Answer |
|---|---|
| What do we KEEP? | The **framework core** under `src/lib/` — design-token system, canonical-primitive component library, config-driven section/admin system, server infra (auth/session/2FA/RBAC/CSRF/rate-limit/audit/upload/storage), DB core tables (users/roles/sessions/settings/translations/legal/audit), i18n engine, the admin shell, deploy tooling. |
| What do we STRIP? | FABRICA22 project layer (`src/project/`), the **portfolio domain** (its biggest custom entity — ≈50 files incl. routes/admin-API/tests), landing-only visuals/animations, brand assets/fonts/colors, demo seed data and marketing copy, obsolete docs. |
| What do we REWRITE? | `src/project/site-config.ts`, `src/project/theme.css`, `src/project/content.json`, locale set, seed-data settings/translations, `legal/` docs, `public/` brand, `.env`. |
| What do we ADD? | Shop tables + services + admin CRUD for **products / categories / orders / order-items / customers(cart)** using the framework's own "blog entity" recipe (15 touch-points, §4.3). |
| Non-negotiables | Validator check #11 (framework never imports project, except 3 files), #6 (canonical primitives), #10/#10b (i18n literals), #12 (no direct Paraglide imports), #14–16 (DB/i18n integrity); `npm run check` green; locale-filtered translation joins everywhere. |

**The single most important structural fact:** FABRICA22 is **not** woven into the
framework. It is a small project layer plus one big custom domain (portfolio). The
framework/project boundary is enforced by `scripts/pm3-validator.mjs` check #11:
`src/lib/**` may import `src/project/**` **only** from `src/lib/config/site.ts`,
`src/lib/components/sections/registry.ts` and `src/lib/components/complex/Onepager.svelte`.
Everything else under `src/lib/` is generic. That is why this fork is cheap.

---

## 1. What the PM3 core gives you (architecture map)

Read these two docs first in the clone:
- `docs/contributing/adding-a-new-entity.md` — the canonical 7-step entity recipe (reference entity: blog).
- `docs/contributing/canonical-primitives.md` — the mandatory component registry.
- `docs/contributing/i18n-literals-policy.md` — how UI text is added safely.
- `docs/design-tokens.md` — required first lookup before inventing any token.

### 1.1 Layer model

```
src/app.css            design tokens (@theme) + reset + keyframes + page transitions
src/project/theme.css  >>> the ONLY brand input: 4 primitives + script font
src/project/site-config.ts  >>> the ONLY site input: locales/nav/sections/modules/features/admin
src/lib/config/site.ts      framework types + assembles + re-exports the project values
src/lib/components/   atoms (37) / molecules (34) / complex (9) / sections (12) / admin (20)
src/lib/plugins/      module-specific viewers (currently portfolio/)
src/lib/stores/       content(t) / settings / theme / locale / navigation / overlays / admin
src/lib/server/       db, services, auth, security, storage, utils (all infra)
src/routes/           +layout.server(+bootstrap), [section], admin/**, api/**, portfolio/**, blog/**
```

### 1.2 The config-driven system (how a "module" turns on/off)

`src/project/site-config.ts` exports (types come from `$lib/config/site`):

- `LOCALES` / `LOCALE_CONFIG` / `DEFAULT_LOCALE` / `SECONDARY_LOCALE` — **locales drive
  everything**: per-entity translation tables, Paraglide catalogs, `legal/` folders,
  messages/*.json. Changing the locale set is a cross-cutting operation (§2.3).
- `HOMEPAGE_SECTIONS: HomepageSection[]` — `{ id, component, renderMode: 'section'|'page', enabled }`.
- `NAV_ITEMS` — canonical (locale-less) hrefs; consumers localize at render time via
  `localizedHref()` from `src/lib/utils/navigation.ts`.
- `MODULES: Record<string, ModuleConfig>` — `portfolio/blog/pricing/faq/features/team/testimonials/clients/contact`,
  each `{ enabled, config }`. Routes gate on `MODULES.x.enabled` (404 when off).
- `FEATURES` — ~25 flat booleans/unions (onepager, twoFactorAuth, pageTransitions, …).
- `ADMIN_CONFIG` — `system.*` + `websiteModules.*` with `{ enabled, roles[] }`. This is the
  admin nav/authorization surface.
- `SEO`, `CONTACT`, `LOGO`, `FOOTER_MADE_BY/WITH`, `DEFAULT_THEME`, `PM_MODE`, `ENTITIES`.

**Runtime-editable settings** live in DB, schema in `src/lib/config/settings-schema.ts`
(groups: contact/location/social/integrations/legal/footer/seo/analytics/verification).
A Shop fork adds a `shop.*` group (currency, shipping, payment mode).

### 1.3 Content pipeline (typed, service-backed)

```
DB ──> services (locale-filtered joins, NEVER Drizzle in routes)
    ──> src/lib/server/services/section-content.ts (loadSectionContent per locale/section)
    ──> src/lib/components/sections/types.ts  (SectionContent typed payload: *Card per slice)
    ──> src/lib/components/sections/props.ts  (buildSectionProps: component → slice mapping)
    ──> SectionRenderer / Onepager  (SECTION_REGISTRY lookup)
```

Stores: `content.svelte.ts` holds the unified `t()` resolver (DB-first → Paraglide →
fallback); it is bootstrapped in `+layout.svelte` from `+layout.server.ts`.

### 1.4 Server infra you inherit for free

Auth (scrypt passwords, lockout, TOTP 2FA via `user_2fa`, server-side `sessions`, change-password),
RBAC (`admin-pages.ts` single registry drives **both** the menu and `requireAdminPage()`),
CSRF double-submit cookie, in-memory rate limiters, security headers + Sentry hook,
storage adapter (local FS under `public/uploads`, S3-shaped interface), audit logs,
health/ops endpoints, virus scan + HIBP breach check (optional), setup-guard + `/init` wizard,
Docker/ansible deploy pipeline (`scripts/setup.sh`, Dockerfile, ansible/).

---

## 2. Step 1 — Rebrand the project seam (do this first, ~1 hour)

### 2.1 Brand primitives — 3 files

| File | Change |
|---|---|
| `src/project/theme.css` | Replace 4 primitives: `--p-brand`, `--p-accent`, `--p-black`, `--p-white`; swap `--font-script` (currently Heebo/Hebrew) for a shop-appropriate script font or drop it; **delete the `:lang(he)` promotion block** if the Hebrew locale is dropped. |
| `src/lib/config/theme.ts` | Mirror the same 4 values in `BRAND_COLORS`. |
| `project/puppet-master.config.ts` | Optional third sync point — the theme.ts header says colors come from this PM config; if you keep the file, update `colors` there too (or delete the file). |
| `src/app.css` | **No brand edits needed** — everything else is derived via `color-mix`/tokens. The `:lang(he)`/script-font blocks do **not** live here (they are in `theme.css`/`@layer base`); only prune `@fontsource` imports for dropped fonts. |

Fonts are `@fontsource*` packages imported at the top of `src/app.css` (`inter`,
`heebo`, `geologica`, `jetbrains-mono`). Decide the shop font stack, prune packages in
`package.json`, and update the `--font-sans/-display/-mono` token definitions.

### 2.2 HTML shell + static brand

- `src/app.html` — `<meta name="theme-color">`, pre-paint theme script, font links.
- `public/` — replace favicons (`favicon.*`, `apple-touch-icon.png`), `og-image.png/svg`,
  `logo.png`, `site.webmanifest`; regenerate via `npm run assets:favicons`.
- `public/logos/` + `public/madebylogos/` (FABRICA22 `.svg` sets, 8 each) — replace with
  the shop brand (LOGO config `available[]` must match actual files, see §2.4).
- **Keep** `public/puppetmaster/` (the framework's own "Made with" brand) and
  `public/uploads/` (runtime uploads).

### 2.3 Locale set (decide NOW — it ripples everywhere)

Current: ru (default) / en (secondary) / fr / he. Every locale in `LOCALES` must have a
full Paraglide catalog, `messages/*.json`, `legal/{locale}/`, and DB translation rows —
validator checks #14/#15 enforce parity. **Recommended shop baseline: `ru` + `en`.**
Pruning a locale touches: `site-config.ts` `LOCALES`, Paraglide `project.inlang/`,
`messages/{fr,he}.json`, `i18n/system-seed.json` locale blocks, `legal/{fr,he}/`,
`scripts/i18n-*-allowlist.json`. Adding a locale requires the reverse plus a
`HERO_MOBILE_TITLE_TOKEN_BY_LOCALE` entry — skip hero token handling if you replace SectionHero.

### 2.4 `src/project/site-config.ts` rewrite checklist

| Export | Shop value |
|---|---|
| `LOCALES`/`DEFAULT_LOCALE`/`SECONDARY_LOCALE` | e.g. `['ru','en']`, default `ru` (or your market). |
| `NAV_ITEMS` | `/#catalog`, `/#about`, `/#contact` … anchor items. |
| `HOMEPAGE_SECTIONS` | hero/catalog/features/faq/contact — no FABRICA22 entries. |
| `MODULES` | remove `portfolio`; keep `faq/features/contact`; add `products` later (§4). |
| `FEATURES` | `onepager: true` stays if you keep the landing concept; `scrollytelling`/`heroParallax`/`verticalNav` off when landing visuals are dropped; `twoFactorAuth: true` keep. |
| `ADMIN_CONFIG` | drop `portfolio`/`team`/`testimonials`/`clients` from `websiteModules`; add `products`/`orders`/`categories` (§4.5). |
| `CONTACT` | new inbox email (currently `contact@fabrica22.pro`). |
| `LOGO`/`FOOTER_MADE_BY` | new brand `basePath`/`available[]`. |
| `SEO` | keys already i18n-backed — only catalog content changes. |
| `PM_MODE` | keep `'build'` (drives `/init` and setup guards; see gotcha §6). |
| `ENTITIES` | `{ website: true, app: false }` unchanged. |

Validator note: check #10b scans `site-config.ts` — keep all labels as `t('...')` keys.

---

## 3. Step 2 — Strip FABRICA22 (the removal list)

### 3.0 Repo hygiene (before/right after cloning)

Delete (never commit): `node_modules/`, `node_modules.broken/`, `data/` (sqlite + imports),
`.env` (regenerate via `scripts/env-bootstrap.mjs`), `.svelte-kit/`, `build/`,
`playwright-report/`, `test-results/`, `e2e-playwright/*-snapshots/`, `tsconfig.tsbuildinfo`.

Delete per-machine/agent state if you want a clean start: `.kilo/`, `.ralph-tui/`,
`.nutausik/`, `.nocowboy/` (tool/harness state of *this* machine; recreate per-project).

Docs to delete (old-session/audit material, not framework docs):
`docs/plans/`, `docs/archive/`, `docs/traycer/`, `docs/analysis/`, `docs/attestations/`,
`docs/roadmap.json`, `docs/ROADMAP.md`, `docs/BACKLOG.md`, `docs/PLAN.md`,
`docs/CSS-FULL-AUDIT.md`, `docs/CSS-EDGECASES.md` (audit artifacts). **Keep**
`docs/contributing/**`, `docs/design-tokens.md`, `docs/ARCHITECTURE.md`,
`docs/CSS-ARCHITECTURE.md`, `docs/STYLE-RULES.md`, `docs/framework-project-boundary.md`.

Root files to update/delete: `README.md` (rewrite), `AGENTS.md` (rewrite project-specific
section; keep framework rules), `package.json` `name` (`puppetmaster3` → e.g. `pm-shop`),
`project/` PM scaffolding (`init/` greenfield prompts, `concept_docs/`) — optional trim.

### 3.1 FABRICA22-only project layer — DELETE

```
src/project/SectionF22.svelte          # custom homepage section (design-studio promo)
src/project/HeroParallaxScene.svelte   # parallax hero canvas
src/project/FallingLetters.svelte      # hero FX
src/project/ProjectAmbient.svelte      # global ambient FX (scrollytelling)
src/project/gsapIntro.ts               # GSAP intro timeline (gsap + matter-js deps)
src/project/portfolio-translations.json
src/project/portfolio-localizations.json
```

Then: remove `gsap`, `matter-js`, `@types/matter-js` from `package.json`; empty the
`PROJECT_SECTIONS` map in `src/project/registry.ts` (keep the file — it is the seam for
shop-specific sections); delete FABRICA22 entries from `HOMEPAGE_SECTIONS` and `NAV_ITEMS`
(section `f22`, item `/#f22`); drop the project section from
`src/lib/server/services/section-content.ts` if referenced; check
`src/lib/components/complex/OnepagerThreeStoryScene.svelte` (scrollytelling story scene —
delete with the landing intro or keep only if your shop hero needs it); turn off
`FEATURES.scrollytelling/heroParallax`.

### 3.2 Portfolio domain — DELETE (the big one, ≈50 files incl. routes/tests)

The portfolio entity is a custom, heavily FABRICA22-coupled domain (media metadata,
case-study viewers, PM2 import tooling). It is **not** a good shop template — delete it.

```
# project data & content
src/project/content.json                      # rewrite for shop demo (see §3.4)
# plugins (module-specific viewers)
src/lib/plugins/portfolio/                    # 6 files: Lightbox, *Viewer (Website/Branding/Brandbook/CaseStudy), types.ts
# admin components
src/lib/components/admin/portfolio/           # 4 files: BrandbookFields, WebsiteFields, BrandingFields, CaseStudyFields
src/lib/components/admin/PortfolioCardPreview.svelte
src/lib/components/admin/PortfolioItemEditor.svelte
src/lib/components/admin/PortfolioItemGrid.svelte
# shared components
src/lib/components/sections/SectionPortfolio.svelte
src/lib/components/molecules/PortfolioCard.svelte
src/lib/components/molecules/PortfolioItemModal.svelte
src/lib/components/molecules/PortfolioLightbox.svelte
src/lib/components/molecules/PortfolioPageShell.svelte
src/lib/components/atoms/PortfolioCardImage.svelte
# client metadata libs
src/lib/portfolio-types.ts
src/lib/portfolio-metadata.ts
src/lib/portfolio-metadata-form.ts
src/lib/portfolio-metadata-import.ts
# server
src/lib/server/services/portfolio.ts
src/lib/server/services/portfolio-admin.ts
src/lib/server/services/portfolio-pm2-source.ts
# public routes
src/routes/portfolio/+page.server.ts  +page.svelte
src/routes/portfolio/[slug]/+page.server.ts  +page.svelte
src/routes/admin/portfolios/          # entire admin CRUD folder (8 files: list + create + [id]/edit + [id]/items)
src/routes/api/portfolios/+server.ts  # public GET listing
src/routes/api/admin/portfolios/      # admin REST CRUD (4 files: +server.ts, [id], [id]/items)
# seed + scripts
src/lib/server/db/seed-data/portfolios.ts
scripts/import-portfolio-translations.ts
scripts/seed-portfolio-localizations.ts
scripts/migrate-portfolio-localization.ts
# static fixtures
public/portfolio-fixtures/            # (plus any FABRICA22 demo images under public/images)
# tests (portfolio-coupled, 5 files in tests/api)
tests/api/*portfolio*.test.ts         # admin-portfolio-published, portfolio-item-localized-text,
                                      # portfolio-item-metadata, portfolio-pm2-enrichment, portfolio-type-change
```

**Wire removals that go WITH the domain** (deleting files alone breaks the build):
1. `src/lib/components/sections/registry.ts` — remove `SectionPortfolio` from `FRAMEWORK_SECTIONS`.
2. `src/lib/components/sections/types.ts` — drop the `portfolios` slice + `PortfolioCard` type.
3. `src/lib/components/sections/props.ts` — drop the `SectionPortfolio` branch.
4. `src/lib/server/services/section-content.ts` — drop portfolio queries + `SECTION_SLICES` entry.
5. `src/lib/server/services/index.ts` — drop portfolio exports.
6. `src/project/site-config.ts` — remove `MODULES.portfolio`, `ADMIN_CONFIG.websiteModules.portfolio`, nav item.
7. `src/lib/server/utils/admin-pages.ts` — remove the `portfolios` `ADMIN_PAGE_DEFS` entry
   (its `module`/`configKey` reference the singular `portfolio` module — drop those from
   `MODULES`/`ADMIN_CONFIG.websiteModules` in site-config as well, per item 6).
8. `src/lib/admin-page-labels.ts`, `src/lib/utils/admin-paths.ts`, `src/lib/utils/admin-nav.ts`,
   `src/lib/server/admin-route-keys.ts` — remove portfolio keys/routes/icons.
9. `src/lib/server/db/schema.ts` — drop tables `portfolios`, `portfolio_items`,
   `portfolio_translations`, `portfolio_item_translations`; remove `'portfolios'` from `ADMIN_PAGE_IDS`.
10. `src/lib/server/db/seed-data/index.ts` — drop `seedPortfolios`.
11. `src/lib/server/db/seed-data/roles.ts` — drop `portfolios` from role permission matrices.
12. `i18n/system-seed.json` — remove `admin.portfolio.*`, `portfolio.*` etc. keys (all locales).
13. `src/routes/admin/api/+server.ts` — remove the `case 'portfolios'` cascade branch + the `'portfolios'` entry in `ALLOWED_MODULES` (the zod enum there uses the plural module id).
14. `scripts/pm3-validator.mjs` — remove portfolio entries from `LOCALE_CONTENT_SPECS` (lines ~1051–1053 hold `portfolio_item_translations` + `portfolio_translations`) and from `TS_CONFIG_SCAN_FILES` if present.
15. `package.json` scripts `import:portfolio-translations`, `seed:portfolio-localizations`.
16. Admin REST routes under `src/routes/api/admin/portfolios/` — already listed in the file block above; verify no other `/api/admin/*portfolio*` survivors via `rg -l portfolio src/routes/api`.

> **Salvage before deleting:** `molecules/PortfolioLightbox.svelte`/plugins Lightbox are a
> generic media-lightbox; promote one copy to `src/lib/components/molecules/Lightbox.svelte`
> if the shop product gallery needs one.

### 3.3 Other landing CMS entities — DECISION (keep disabled vs delete)

`blog`, `pricing`, `faq`, `features`, `team`, `testimonials`, `clients` are *generic*
landing modules (each: service + section + admin CRUD; **seed data exists only for
`faq` and `features`** — the other tables start empty until the admin adds rows, so
deleting them is content-free). They are your **templates** — the shop's Products
module is built by cloning the blog/faq recipe. Options:

| Entity | Shop value | Recommendation |
|---|---|---|
| `blog` | none directly, but **canonical template** (service + editor + tags/media) | **KEEP as reference** while building products; delete at the end, or keep enabled for a content/shop hybrid |
| `faq` | shipping/returns FAQ on PDP | keep |
| `features` | product highlights / why-us | keep (currently disabled — re-enable or delete) |
| `pricing` | pricing/plans page if shop sells plans | keep-if-needed; **closest price-display analog for Product cards** |
| `team`/`testimonials`/`clients` | testimonials≈reviews, rest ≈ none | disable via config; delete files for a lean core |

Deleting one of these follows the **same 16-point wire-removal** as §3.2 (service, section,
registry, types/props, section-content, seed-data, admin routes + defs + labels + paths +
nav + route-keys + roles, schema tables, admin/api cascade, i18n keys, validator specs).
The blog module shows the granularity: ~10 route files (public `/blog` + `/blog/[slug]`
and admin list/create/edit) plus service, section component, `BlogPostCard` molecule,
and the shared wiring entries (schema tables, `types.ts` slice, `props.ts`, registry,
route-keys).

### 3.4 Demo data & legal — REPLACE

- `src/lib/server/db/seed-data/settings.ts` — remove the brand-backfill block and set
  neutral values: `contact.email`, `social.*`, `legal.companyName`, `seo.title/description/
  keywords`, `contact.telegramTimezone` (all currently Фабрика 22 / ldcodesign@yandex.ru).
- `src/lib/server/db/seed-data/features.ts`, `faq.ts` — framework *demo* copy mentioning
  "Puppet Master / Codex / Claude / Qwen" — replace with shop demo rows (or delete when module off).
- `legal/` — the files are generic owner-agnostic templates (`privacy-policy`,
  `personal-data-policy`, `terms-of-service` per locale under `legal/{locale}/*.md`,
  seeded into the DB and admin-editable). Keep them, **add the e-commerce set** —
  `refund-policy`, `shipping-policy`, `offer` — via the same markdown + slug pattern
  (register slugs in `src/lib/server/services/legal.ts` + `src/lib/utils/legal-documents.ts`),
  and delete `legal/{locale}/` folders for any locale you prune in §2.3.
- `src/project/content.json` — FABRICA22 copy seed; becomes the shop's **demo content
  catalog** (marketing strings + a handful of demo product rows if you seed products as
  DB content).
- `tests/` that assert FABRICA22 data/entities must be rewritten (see §5.3).

---

## 4. Step 3 — Build the Shop domain

### 4.1 Domain model (follow PM3 conventions exactly)

Every localizable entity = **base row table + per-locale `*_translations` table**
(`unique().on(ownerId, locale)`, `index()`), typed enum lists as `as const` arrays.

| Shop concept | Base table | Translation table (if localizable) | Pattern source |
|---|---|---|---|
| Category | `product_categories` (`slug` uq, `parentId` self-FK, `order`, `published`) | `product_category_translations` | `blog_categories` |
| Product | `products` (`slug` uq, `sku` uq, `categoryId`, `priceCents` int, `currency`, `stockQty`, `coverImageUrl`, `published`, `order`, timestamps) | `product_translations` (`name`, `shortDescription`, `description` markdown) | `pricing_tiers` + `portfolio_items` |
| Product media | `product_media` (`productId`, `type` image/video, `url`, `thumbnailUrl`, `order`) | — | `blog_media` |
| Product variants | `product_variants` (`productId`, `sku`, `options` JSON e.g. `{size,color}`, `priceDeltaCents`, `stockQty`) | — | new; JSON column pattern like `socialLinks` |
| Customer | `customers` (`email` uq, `name`, `phone`) — guest checkout stores inline on order; accounts optional later | — | `contact_submissions` + (if accounts) clone `users` auth |
| Cart | `carts` + `cart_items` (TTL cleanup like `sessions`) **or** client-side cart store + server cart endpoint | — | `sessions`/`stores/*.svelte.ts` |
| Order | `orders` (`orderNumber` uq, `customerId?`, `email`, `status` enum, `subtotalCents`, `shippingCents`, `totalCents`, `currency`, `shippingAddress` JSON, `contactEmail`, timestamps) | — | new |
| Order item | `order_items` (`orderId`, `productId`, `variantId?`, `qty`, `unitPriceCents`, `productSnapshot` JSON) | — | `pricing_features` child pattern / `blog_post_tags` join |
| Order history | `order_status_history` (`orderId`, `from`, `to`, `note`, `userId`, `createdAt`) | — | `audit_logs` |
| Stock | `stock_movements` (`productId`, `delta`, `reason`, `orderId?`, `createdAt`) | — | audit pattern |

**Reuse as-is:** `users`, `roles`, `sessions`, `user_2fa`, `settings` (+ `shop.*` group),
`translations` (+ `shop.*` keys), `legal_documents` (+ refund/shipping slugs),
`audit_logs`, `contact_submissions` (customer questions).

**Order status enum** (as-const string list in schema): `pending` → `paid` → `fulfilled`
→ `shipped` → `delivered`; plus `cancelled` / `refunded` from any active state. Admin
transitions write `order_status_history` + `audit_logs`; every transition is a service
method, not inline route logic.

**Payments:** keep PSPs out of the core. Define a `PaymentProvider` adapter seam under
`src/lib/server/payments/` mirroring the existing `src/lib/server/storage/` adapter shape
(`types.ts` interface + `index.ts` factory + one stub provider e.g. `cash-on-delivery`/
`test`), so real providers (Stripe/YooKassa/etc.) become plugin modules later. Order
creation reserves stock; payment confirmation commits it.

### 4.2 Catalog & checkout public surface (patterns to copy)

| Route | Pattern to copy |
|---|---|
| `/` homepage with `SectionProducts` | Onepager + `HOMEPAGE_SECTIONS` |
| `/products` category/catalog listing | `src/routes/portfolio/+page.server.ts` (module gate `MODULES.products.enabled`, `itemsPerPage`, `getPublicProductListing`) |
| `/products/[slug]` PDP | `src/routes/blog/[slug]/+page.server.ts` (module gate + `published` + 404) |
| `/cart`, `/checkout` | new; SSR pages hitting cart service |
| `POST /api/cart/items`, `/api/checkout` | `src/routes/api/contact/submit/+server.ts` pattern: rate limit → Zod → CSRF (auto-injected by `api/client.ts`) → `{success:true}` envelope |
| Admin orders inbox | `src/routes/admin/contacts/+page.svelte` pattern (list + unread count) |
| Cart count in header | extend `content`/`settings` store family or a small `cart.svelte.ts` store |

`SectionContent` in `src/lib/components/sections/types.ts` gains slices
`products: ProductCard[]` (and later `featuredProducts`); `section-content.ts` gets a
`products` slice + `SECTION_SLICES` entry; `SectionProducts.svelte` renders cards via the
canonical primitives.

### 4.3 Adding ONE shop module = the 15-file checklist

Verified against the blog entity. `products` (localizable) touches **all** of these;
`orders` (not localizable, admin-only like `contacts`) touches a subset (no section,
no translations table, no types/props):

1. `src/lib/server/db/schema.ts` — tables + `'products'` into `ADMIN_PAGE_IDS`.
2. `src/lib/server/services/products.ts` — **always locale-filter translation joins**; export from `services/index.ts`.
3. `src/lib/components/sections/SectionProducts.svelte` — JSDoc + `class`/`twMerge` + empty state + `t()`; register in `sections/registry.ts`.
4. `src/lib/components/sections/types.ts` — `ProductCard` + slice.
5. `src/lib/server/services/section-content.ts` — slice query + `SECTION_SLICES`.
6. `src/project/site-config.ts` — `HOMEPAGE_SECTIONS` + `MODULES.products` + nav + `ADMIN_CONFIG.websiteModules.products`.
7. Admin CRUD `src/routes/admin/products/` (list/create/`[id]/edit`) via `AdminEditorPage`; delete-cascade `case 'products'` + `ALLOWED_MODULES` in `src/routes/admin/api/+server.ts`.
8. `src/lib/server/utils/admin-pages.ts` — `ADMIN_PAGE_DEFS` entry (menu + defaultRoles).
9. `src/lib/admin-page-labels.ts` + `src/lib/utils/admin-paths.ts` + `src/lib/utils/admin-nav.ts` + `src/lib/server/admin-route-keys.ts` — labels/routes/icon/route-key-scope.
10. `src/lib/server/db/seed-data/roles.ts` — `products` in master/admin (and editor?) permission JSON.
11. `src/lib/server/db/seed-data/products.ts` + register in `seed-data/index.ts`.
12. `i18n/system-seed.json` — `admin.products.*` + `products.*` keys for **every** locale → `npm run i18n:export`.
13. `npm run db:seed` (admin keys are DB-resident only).
14. `scripts/pm3-validator.mjs` — `LOCALE_CONTENT_SPECS` entry for `product_translations`.
15. Tests — service test (locale filter), public listing/404, admin create/edit flow.

Use `AdminEditorPage` for products (multi-field + markdown + media + repeatable
variants/images), `AdminModal` only for small list-context records. Create page title
`t('common.create')`, edit `t('common.edit')`.

### 4.4 Shop settings & i18n namespaces

- Add `shop.*` group to `settings-schema.ts`: `shop.currency`, `shop.shipping.methods`,
  `shop.shipping.flatRate`, `shop.freeShippingThreshold`, `shop.orderEmailNotify`,
  `shop.paymentMode` (adapter selection), `shop.stockLowThreshold`.
- Content labels are DB-resident `type='content'` (admin-editable); UI labels go to
  `i18n/system-seed.json` as `shop.*` / `admin.products.*` / `admin.orders.*`.
- Legal: `refund-policy`, `shipping-policy` slugs gated exactly like the existing legal
  docs gate (§3.4).

### 4.5 Admin menu for the shop

Final `ADMIN_CONFIG.websiteModules` for the core framework: `products`, `categories`,
`orders` (+ `contacts`, `faq`, optional `blog`); `system.*` unchanged. Orders/categories
admin pages follow `contacts`-style list + `AdminModal`/read-only detail.

---

## 5. Verification & Definition of Done

### 5.1 Commands (every change, before commit)

```
npm run check                 # svelte-check, authoritative TS
node scripts/pm3-validator.mjs  # 16 checks (primitives, tokens, boundary, i18n, DB)
npm run i18n:validate         # system-seed catalog drift/wrong-script/gaps
npm run db:reset              # schema push + seed (only when schema/seed changed)
npm test                      # vitest unit/api suite
npm run lint                  # eslint --max-warnings=0 (pre-commit also runs pm3-validator)
```

Pre-commit = husky + lint-staged (`pm3-validator.mjs` + eslint) — keep it.

### 5.2 Regression targets after the strip

- `/` renders the shop homepage; `/admin/login` works; master user from `.env` bootstraps;
- 404 for removed routes (`/portfolio`, `/admin/portfolios`) — module gates + deleted routes;
- `npm run check` and validator #14/#15/#16 pass against a **fresh** `db:reset` (no FABRICA22
  rows left); grep repo for `fabrica22`, `Фабрика`, `portfolio`, `ldcodesign`, `Фабрика 22`
  → only hits in `docs/` history you intentionally kept.
- `npm run build` + `npm run preview` smoke.

### 5.3 Tests to fix/rewrite

`tests/api/` portfolio tests (5 files: `admin-portfolio-published`, `portfolio-item-localized-text`,
`portfolio-item-metadata`, `portfolio-pm2-enrichment`, `portfolio-type-change`), `tests/api/contact-login|admin-user-contact-ops`
(contact kept — fine), `tests/routes/section-content.test.ts` (slice content changed),
`e2e-playwright/admin-edit-journeys.spec.ts` (drives blog/portfolio admin — point at
products/faq), `tests/i18n` & `tests/scripts` if they assert removed keys. The blog entity
tests are your template for the new products tests.

---

## 6. Gotchas & known traps (from this codebase)

- **Schema says 33 tables, docs say 31.** Trust `schema.ts`. Update AGENTS.md after stripping.
- **Seed idempotence:** `settings`/`translations` use sync semantics (insert-or-preserve),
  others skip when non-empty. After changing seed content run `db:reset`, not `db:seed`,
  to see the change.
- **`PM_MODE: 'build'` is permanent** and does **not** gate bootstrap-credential
  enforcement; that keys on `NODE_ENV=production` or `PM_ADMIN_BOOTSTRAP_ENFORCE=true`.
  `.env` needs `TOTP_ENCRYPTION_KEY` at boot because 2FA is on — `env-bootstrap.mjs`
  generates one on first run.
- **Translation joins must filter by locale** — the #1 historical bug class. Every
  `*_translations` read goes through the active-locale helper.
- **`SECONDARY_LOCALE`** makes the validator flag values identical to English too — keep it
  pointing at your real lingua franca or set `null` if single-locale.
- **messages/*.json and `messages/` are generated** — never hand-edit; edit
  `i18n/system-seed.json` then `npm run i18n:export`. `admin.*` keys additionally need
  `npm run db:seed`.
- **Admin editing surfaces are exactly two** — `AdminEditorPage` (page) or `AdminModal`
  (modal). Don't invent a third.
- **i18n-literal baseline is frozen and shrinks only** (`scripts/i18n-literal-baseline.json`).
  New visible strings must come through `t()` — if a *legitimate* literal is needed the
  baseline update is code-review-gated.
- **Framework→project boundary (check #11)** — shop sections live in `src/project/` +
  `registry.ts` unless they're framework-general; `src/lib/` never imports `src/project/`.
- **Keep the locale-per-entity translations convention** even for single-locale shops —
  dropping it is how future multi-locale migrations die.

---

## 7. Suggested build order (roadmap for the fork)

| # | Milestone | Exit criteria |
|---|---|---|
| 1 | **Clean clone boots** (§2+§3 strip + rebrand) | `check` + validator green, no `portfolio`/`fabrica` residue, `/` shows blank shop shell |
| 2 | **Catalog entity** (`products` + `product_categories`) | admin CRUD, `/products`, `/products/[slug]`, seeded demo products, locale-correct |
| 3 | **Cart** (add/remove/qty) | header badge, `/cart`, server validation, stock check |
| 4 | **Checkout + Orders** | order creation, admin `orders` inbox + status transitions, stock decrement + `stock_movements`, emails via existing SMTP notify pattern |
| 5 | **Shop settings + legal** | `shop.*` settings group, refund/shipping legal docs, payment adapter seam |
| 6 | **Payments provider (first real PSP)** | one adapter implemented behind §4.1 seam |
| 7 | **Polish** | tests/e2e for the shop flows, README/AGENTS rewrite, `package.json` rename |

Each milestone goes through the normal pipeline: spec + AC → implement → review → verify.

---

*This document accompanies the fork. Keep it at the repo root of the new PuppetMaster
Shop repository and update it as decisions are made (module keep/delete choices, PSP,
locale baseline).*
