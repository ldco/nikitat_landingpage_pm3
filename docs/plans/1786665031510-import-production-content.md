# Plan: Import nikitat.pro Production Content into PM v3

**Date:** 2026-08-14
**Status:** Proposed
**Author:** Architect (no implementation code written)
**Confidence:** 🟡 Medium — live DB content not yet observable (SSH key missing); structural facts verified against the local PM v2 proxy DB and the v3 codebase.

---

## 1. Goal

Seed the **PM v3 (SvelteKit)** database at `data/sqlite.db` with the **original nikitat.pro site's content** — texts, images, and the portfolio — pulled from the **live production PM v2 (Nuxt)** database, so the rebuilt site renders the real content instead of the current seed placeholders (2 placeholder branding portfolios, 3 features, 3 FAQ, 0 portfolio items).

**In scope:** `portfolios`, `portfolio_items`, content `translations`, content-relevant `settings`, and image assets.
**Out of scope (never migrated):** `users`, `roles`, `sessions`, `user_2fa`, `audit_logs`, `contact_submissions` (PII). The v3 app has its own seeded admin credentials and must keep them.

---

## 2. Context & Findings (verified)

### 2.1 The original site
- `nikitat.pro` runs **PM v2 (Nuxt)** live at `77.232.128.122`.
- Local copies of the v2 codebase exist: `nikitat/app-nuxt` (current v2), `nikitat/app_pm2_deprec` (deprecated PM2 snapshot).

### 2.2 Source of truth (user-selected: live production DB)
- Remote DB: `/home/deploy/app/shared/nikitat-pro/data/sqlite.db`
- Remote uploads: `/home/deploy/app/shared/nikitat-pro/uploads`
- SSH user: `deploy`; auth mode `ssh_key` but the key `~/.ssh/pm_deploy_nikitat.pro` is **missing**. `DEPLOY_USER_PASSWORD` is present in `app-nuxt/.env` (34 chars) and `sshpass` is installed → **password auth is the available path** (ADR-002).

### 2.3 Structural proxy (deprecated PM2 DB — `app_pm2_deprec/app/data/sqlite.db`, 1.4 MB)
Used to derive the exact transform rules before the live pull. Contents:
- **5 portfolios** — `branding` (36 items), `terminals-kiosks` (5, `case_study`), `websites` (6, `website`), `tools-frameworks` (7, `website`), `typography` (21, `website`).
- **75 `portfolio_items`**, all `item_type='case_study'`.
- **4 353 translations** (en 1 171 / fr 1 219 / he 999 / ru 964) — mixed system + content.
- **47 settings** (contact.*, social.* real values).
- blog/pricing/faq/features/team/testimonials/clients/contact_submissions: **all 0 rows**.

### 2.4 Schema parity (PM v2 → PM v3)
Both are 31-table Drizzle/SQLite. The only deltas:
| Delta | v2 | v3 |
|---|---|---|
| `translations` columns | `id, locale, key, value, updated_at` | + `type` (system/content), + `customized` (bool) |
| `legal_documents` | absent | present (v3-only, already seeded) |
| `users` | no `must_change_password` | + `must_change_password` |

Everything else (portfolios, portfolio_items, blog, pricing, faq, features, settings, etc.) is column-identical → **direct copy is safe** for those tables.

### 2.5 Content model (v3) — how portfolio items render
- `portfolio_items` stores `title`, `description`, `content`, `metadata` (JSON) directly on the row (Russian fallback text).
- Per-type metadata shapes are enforced by `src/lib/portfolio-metadata.ts`:
  - `branding`: `{ sections: [{title, text?}], clientUrl?, tags[] }`
  - `website`: `{ liveUrl? (http(s)://|mailto:|tel:), technologies[], screenshots: [{url, caption?}] }`
  - `case_study`: `{ tags[] }` (flat `content` holds the body)
- **Branding images** render via `BrandingViewer` from **`portfolio_items` with `item_type='image'` + `media_url`** (not from a metadata gallery).
- **Website screenshots** render from `metadata.screenshots`, falling back to `image`-type items.
- **Case-study headings** inside `content` are translated via `portfolio.heading.{normalized}` keys (service layer `translateHeading()`).

### 2.6 Critical shape differences found (must transform)
1. v2 branding `metadata.sections[]` = `{heading, content: string[]}` → v3 expects `{title, text: string}`.
2. v2 branding `metadata.gallery[]` = image-path array (36 items have it) → v3 has **no gallery field**; images must become separate `item_type='image'` rows.
3. v2 website `metadata.liveUrl` = bare domain (`"pulsik.pro"`) → v3 `safeUrl` requires a scheme → prepend `https://`.
4. v2 case-study `content` = plain text (no `### ` markdown) → renders as paragraphs only (no headings) — acceptable, no transform needed.

### 2.7 Image assets already local
v3 `public/uploads/portfolios/` already contains every directory the source references: `branding/` (69 files), `websites/` (6), `frameworks/` (8), `typography/` (23 incl. `cyrillic/kosovo` + `hebrew`), and additionally `brandbooks/` (91 files: `divnydom`, `kapibara`, `kolabor`, `pitbull`, `realcars`) — **with no matching portfolio in the deprecated snapshot**. This signals the live DB likely contains more content (a brandbook portfolio) than the deprecated proxy. Pull-and-verify is therefore required.

---

## 3. Migration Mapping

### 3.1 `portfolios` → direct copy
Copy all columns 1:1 (`slug`, `name`, `description`, `type`, `cover_image_url`, `cover_thumbnail_url`, `order`, `published`, timestamps). Preserve source `id` where possible (or remap FK references consistently). Expect ≥5 rows (possibly + `brandbook`).

### 3.2 `portfolio_items` → copy + metadata rewrite
Copy all columns 1:1, then rewrite `metadata` JSON per portfolio type:

| Portfolio type | Transform |
|---|---|
| `branding` | `sections[].heading` → `title`; `sections[].content[]` → `text` (join with `"\n\n"`); drop `gallery` from JSON; keep `clientUrl`, `tags` |
| `website` | `liveUrl` bare domain → `https://` + domain; keep `technologies`/`screenshots` if present; otherwise leave absent |
| `case_study` | copy metadata as-is (typically `{}` or null); preserve flat `content` |
| `brandbook` (if present) | copy `{pdfUrl, pages:[{url,caption}]}` as-is (shape already matches) |

**Gallery → image items (ADR-003):** for each branding item's `metadata.gallery[]` entry *beyond* the cover (already held by `media_url`/`thumbnail_url`), emit an additional `portfolio_items` row:
- `item_type = 'image'`, `media_url` = path, `thumbnail_url` = path, `caption` = null, `order` = incremental continuation, `published = true`, `portfolio_id` = parent portfolio, `metadata = null`.

This preserves all images and matches v3's rendering model exactly.

### 3.3 `translations` → import content namespaces only
v3 classification is `isSystemKey()` (prefixes: `admin.`, `nav.`, `common.`, `auth.`, `validation.`, `footer.`, `error.`, `apiErrors.`).

| Decision | Namespaces |
|---|---|
| **Import as `type='content'`, `customized=false`** | `portfolio.*`, `portfolio_item.*` (the bulk — 915+206 rows), `hero.*`, `about.*`, `focus.*`, `f22.*`, `seo.*`, `contact.*`, `sections.*`, `pricing.*`, `legal.*`, `legalDocuments.*`, `cookies.*`, `cta.*`, `blog.*`, `testimonials.*`, `team.*`, `features.*`, `faq.*`, `clients.*` |
| **Skip** (v2 system strings; v3 catalog `i18n/system-seed.json` already owns them) | `admin.*`, `init.*`, `setup.*`, `theme.*`, `settings.*`, `apiErrors.*`, `common.*`, `auth.*`, `validation.*`, `error.*`, `footer.*`, `nav.*` |

Skip any source key that already exists in the v3 `translations` table (the catalog is the authority for system rows; content rows are editor-owned → backfill-only). Add `type` = result of `classifyTranslationType(key)` and `customized = false`.

> **Known caveat:** v2 section-heading keys use `portfolio.section.*`; v3 resolves case-study headings via `portfolio.heading.*`. Branding sections render their `title` directly (untranslated). Import `portfolio.section.*` as content for historical completeness, but do not rely on it for v3 rendering.

### 3.4 `settings` → copy content-relevant keys only
Copy `contact.*` (email, phone, location, workingHours) and `social.*` (telegram, whatsapp, etc.). **Skip** structural/technical keys v3 manages itself (verify per-key against v3's `seed-data/settings.ts` and the settings schema). Never overwrite v3-owned structural settings.

### 3.5 Excluded tables (security & state)
`users`, `roles`, `sessions`, `user_2fa`, `audit_logs`, `contact_submissions` — **not copied**. Confirm post-migration that these row counts are unchanged.

---

## 4. Image Handling

1. Extract the set of referenced paths from source `portfolio_items.media_url`, `.thumbnail_url`, and `metadata` (gallery/screenshots/pages).
2. Diff against `public/uploads/**` in v3.
3. Pull any missing files from the live `.../uploads` tree (rsync/scp) and, if needed, from `app-nuxt/public/uploads`.
4. Verify every referenced path resolves (file exists) before declaring success.

---

## 5. Implementation Approach

Two new artifacts (no framework code touched):

### 5.1 `scripts/pull-production-content.sh`
- Uses `sshpass` + `DEPLOY_USER_PASSWORD` (from `app-nuxt/.env`) → `scp`/`ssh` to `deploy@77.232.128.122`.
- Pulls `/home/deploy/app/shared/nikitat-pro/data/sqlite.db` → `data/import/from-production/sqlite.db`.
- Runs `sqlite3 <db> "PRAGMA integrity_check;"` and refuses on failure.
- Pulls missing uploads via `rsync -avz` into `public/uploads/`.
- Non-destructive: never writes to the live DB; only reads + downloads.

### 5.2 `scripts/import-pm2-content.ts`
- `tsx --env-file=.env scripts/import-pm2-content.ts <source-db> [--dry-run] [--with-settings]`
- Opens source DB read-only with `better-sqlite3`; opens target via `useDatabase()` (Drizzle).
- Runs the transforms in §3 inside **one transaction** (or per-table transactions).
- Idempotent: skip portfolios/items by `slug` if already present (or `--force` to upsert).
- Prints per-table counts: portfolios inserted, items inserted, image-items synthesized, content translations added/skipped, settings copied.
- `--dry-run` prints the plan and writes nothing.
- Never touches auth/state tables (compile-time exclude list).

---

## 6. Architectural Decision Records

### ADR-001 — Pull-then-transform migration (vs alternatives)
**Context:** Original content lives in a live PM v2 SQLite DB; target is a nearly-identical PM v3 schema.
**Decision:** A one-off, idempotent import script that reads the pulled DB, transforms, and writes the v3 DB.
**Options considered:**
1. *Direct table copy* (attach both DBs, `INSERT ... SELECT`) — fastest, but cannot handle metadata/translation shape differences and would copy auth by accident. ❌
2. *Re-express content as v3 seed-data modules* — reproducible, but duplicates 75+ items as code and discards live edits. ❌
3. *Dedicated transform script* — explicit, auditable, dry-run-capable, handles all deltas. ✅
**Consequences:** More up-front script work; full control over transform + exclusion of secrets; repeatable for future resyncs.

### ADR-002 — Password-based SSH access (vs restoring key)
**Context:** Deploy key `~/.ssh/pm_deploy_nikitat.pro` is missing; `DEPLOY_USER_PASSWORD` exists and `sshpass` is installed.
**Decision:** Use `sshpass` + password for the read-only pull.
**Options:** restore key (requires user to supply it — better long-term but blocks now) / password (immediate, already configured). ✅ password now, recommend restoring the key later for ongoing deploys.
**Consequences:** Credential must not be echoed/logged; `sshpass -e` (env var) preferred over `-p` on the command line.

### ADR-003 — Split branding `gallery` into `image` items (vs dropping)
**Context:** v2 stores a per-item image gallery in `metadata.gallery`; v3 renders branding images from `image`-type items.
**Decision:** Synthesize `image` items from each gallery entry.
**Options:** drop gallery (loses most images ❌) / extend v3 schema+viewer to read `gallery` (framework change, out of scope ❌) / synthesize image rows (matches v3 model, zero framework change ✅).
**Consequences:** Item count will exceed the source's 75; covers must not be duplicated (skip the gallery entry that equals `media_url`).

---

## 7. Verification Checklist

- [ ] SSH pull succeeds; pulled DB passes `PRAGMA integrity_check`.
- [ ] Post-import counts: portfolios ≥5, items = source count + synthesized image items, content translations >0.
- [ ] `users`/`roles`/`sessions`/`user_2fa`/`audit_logs`/`contact_submissions` row counts **unchanged**.
- [ ] `/portfolio` lists all portfolios with correct covers.
- [ ] `/portfolio/[slug]` renders sections (branding), screenshots (website), content (case_study) correctly.
- [ ] Every referenced `/uploads/...` path resolves to an existing file.
- [ ] `npm run check` and `npm run build` pass; `npm run validate:pm3` passes.
- [ ] No new untranslated string literals (i18n validator clean — content rows are seeded as DB translations, not code).

## 8. Rollback / Migration Path

- **Pre-migration backup:** `cp data/sqlite.db data/sqlite.db.pre-import` (and remove `-wal`/`-shm`).
- **Rollback:** restore the backup file (or `npm run db:reset` to return to seed state).
- **Safety:** import runs `--dry-run` first; it is idempotent; auth tables are excluded by construction.
- **Live site:** untouched — the import is read-only against production.

## 9. Risks & Edge Cases

- 🟡 **Live DB ≠ deprecated proxy** — may include a `brandbook` portfolio and other rows. The transform handles `brandbook` shapes; verify all portfolio types after pull.
- 🟡 **`liveUrl` scheme** — some values may already have schemes or be empty; normalize defensively.
- 🔴 **Metadata parse failures** — malformed JSON in source must degrade to `{}` (mirror `parseItemMetadata`), never crash the import.
- 🟡 **Gallery/cover duplication** — skip gallery entries identical to `media_url`/`thumbnail_url`.
- 🔴 **Secret leakage** — never commit the password or the pulled DB; keep `data/import/` gitignored.
- 🟡 **Content vs system misclassification** — verify `settings.*`/`init.*`/`theme.*` are skipped; spot-check that no v2 system string overwrites a v3 catalog row.

## 10. ISO 25010 Quality Snapshot

| Dimension | Risk | Note |
|---|---|---|
| Functional Suitability | ✅ | Covers texts + images + portfolio |
| Reliability | ✅ | Idempotent, transactional, integrity-checked |
| Performance | ✅ | One-off batch; single transaction |
| Security | ✅ | Auth/PII excluded; secrets not committed |
| Compatibility | ⚠️ | Metadata/heading namespace diffs require transforms |
| Maintainability | ✅ | Two small scripts; no framework code touched |
| Portability | ✅ | `tsx` + `better-sqlite3` + `sqlite3`, all present |
| Usability | ✅ | `--dry-run` + per-table report |

---

## 11. Handoff

After approval, implement:
1. `scripts/pull-production-content.sh`
2. `scripts/import-pm2-content.ts`
3. Run pull → `--dry-run` → real import → run §7 verification.
