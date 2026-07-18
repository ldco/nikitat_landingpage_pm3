# Deploy Pipeline Hardening — Root Cause Analysis & Propagation Plan

**Status:** Accepted
**Created:** 2026-06-19
**Scope:** All PM framework projects (nikitat, zinnatov, and pending deploys)

---

## 1. Root Cause Analysis

### Why nikitat failed

Three independent bugs cascaded during `npm run setup`:

| # | Bug | File | Root Cause |
|---|---|---|---|
| 1 | Migration runner uses timestamp comparison | `scripts/docker-migrate.mjs` | Migration 0002 has `when: 1737244800000` (Jan 2025) — 11 months earlier than 0000/0001 (Dec 2025). Combined with `auto_sync_local_data_on_first_setup` copying a `db:push`-created DB (all tables, zero tracking), the runner sees no tracking, considers ALL migrations pending, `CREATE TABLE contact_submissions` fails because it already exists. |
| 2 | `rotate-admin-passwords.mjs` not in Docker image | `Dockerfile` | Script referenced by `deploy.yml:196` but not COPYd to production stage. Crashes with `MODULE_NOT_FOUND`. |
| 3 | Traefik routing config not generated during setup | `scripts/setup.sh` | `deploy.sh` calls `pm-traefik-config.sh` after Ansible deploy; `setup.sh` does not. Traefik has empty routing, health check gets 404. |

### Why zinnatov appeared to succeed

zinnatov has identical bugs but they manifest silently:

| Bug | zinnatov behavior | Why it did not crash |
|---|---|---|
| Timestamp comparison | Migration 0002 silently skipped forever — `lastCreatedAt (1767009708323) < 1737244800000` is `false`, so 2FA schema is never applied | No crash, but production DB is missing: `user_2fa` table, `two_factor_enabled` column, `role_id` column |
| Missing Dockerfile COPY | `pm_admin_password_rotation_enabled` defaults to `false` — the Ansible task is `skipping` | Conditional `when:` clause hides the bug |
| Missing Traefik config in setup | Either DNS was not pointed yet, or `npm run deploy` was run separately (which calls `pm-traefik-config.sh`) | Bug exists but was not observed |

**Conclusion:** zinnatov deploy is silently broken. The 2FA feature will crash at runtime. Migration 0002 was never applied.

### The backward timestamp

Both projects share the same `_journal.json`:

```
idx 0: when 1765776040883  (Dec 14 2025)
idx 1: when 1767009708323  (Dec 28 2025)
idx 2: when 1737244800000  (Jan 18 2025)  <-- 11 months EARLIER
```

Migration 0002 (`0002_add_two_factor_auth.sql`) was hand-authored with a hardcoded timestamp instead of using `drizzle-kit generate`. The timestamp `1737244800000` is exactly `2025-01-19T00:00:00.000Z` — a round date, confirming it was manually set.

---

## 2. Fixes Applied to nikitat

### Fix 1: Migration runner (`scripts/docker-migrate.mjs`)

| Change | Before | After |
|---|---|---|
| Pending detection | `lastCreatedAt < entry.when` (timestamp) | `entry.idx > lastIdx` (journal index) |
| Tracking schema | `id, hash, created_at` | `id, migration_idx, hash, created_at` |
| Legacy backfill | none | `backfillMigrationIdx()` upgrades old entries |
| CREATE TABLE | Bare `CREATE TABLE` | `CREATE TABLE IF NOT EXISTS` via regex with `m` flag |
| CREATE INDEX | Bare `CREATE [UNIQUE] INDEX` | `CREATE [UNIQUE] INDEX IF NOT EXISTS` |
| ALTER TABLE ADD COLUMN | Crashes on duplicate | `isAlreadyExistsError()` catch and skip |
| Transaction scope | Single transaction for ALL migrations | Per-migration transaction (progress preserved) |

### Fix 2: Dockerfile

Added line 129:
```dockerfile
COPY --from=builder --chown=nuxt:nodejs /app/scripts/rotate-admin-passwords.mjs ./scripts/rotate-admin-passwords.mjs
```

### Fix 3: setup.sh

Added stage between `ansible_app_rollout` and `public_health_check`:
```bash
start_setup_stage "traefik_config_generation"
log "Regenerating Traefik routing config for all deployed projects."
bash "$ROOT_DIR/scripts/pm-traefik-config.sh"
finish_setup_stage "traefik_config_generation"
```

---

## 3. Propagation Plan

These fixes must be applied to every PM framework project before their next deploy.

### Files to propagate

| Source (nikitat) | Target (each project) | Method |
|---|---|---|
| `scripts/docker-migrate.mjs` | Copy verbatim | Identical across all projects |
| `Dockerfile` (line 129) | Add COPY line after `ops-agent.mjs` | One-line addition |
| `scripts/setup.sh` (lines 573-576) | Add traefik stage after `ansible_app_rollout` | 5-line addition |

### Propagation checklist per project

For each project in FABRICA22:

- [ ] Copy `scripts/docker-migrate.mjs` from nikitat
- [ ] Add `rotate-admin-passwords.mjs` COPY to Dockerfile (if not present)
- [ ] Add `pm-traefik-config.sh` stage to setup.sh (if not present)
- [ ] Verify `_journal.json` timestamps — if migration 0002 exists with backward timestamp, it will now be correctly applied on next deploy
- [ ] For already-deployed projects (like zinnatov): run `npm run deploy` to apply the migration runner fix and execute skipped migration 0002

### Verification

After propagation, each project should pass:
```bash
node --check scripts/docker-migrate.mjs
grep 'rotate-admin-passwords.mjs' Dockerfile
grep 'pm-traefik-config.sh' scripts/setup.sh
```

---

## 4. DNS — Not a Deploy Bug

The health check failure at the end of nikitat setup was caused by `nikitat.pro` DNS pointing to Reg.ru parking servers. The VPS responds correctly when accessed directly:

```bash
curl -sk --resolve nikitat.pro:443:77.232.128.122 https://nikitat.pro/api/health
# returns {"success":true,"data":{"status":"ok",...}}
```

**Action:** Set A record for `nikitat.pro` to `77.232.128.122` at Reg.ru.

---

## 5. ADR: Migration Runner Timestamp vs Index Comparison

### Status: Accepted

### Context
Drizzle Kit migration journal uses a `when` timestamp field and an `idx` sequential index. The original PM migration runner compared by `when` to determine pending migrations. Migration 0002 was hand-authored with a timestamp predating earlier migrations.

### Decision
Use `idx` (sequential journal index) for determining pending migrations instead of `when` (timestamp).

### Consequences
- Hand-authored migrations with any timestamp work correctly
- Backward-compatible: legacy tracking entries are backfilled via `created_at` to journal match
- New column `migration_idx` added to `__drizzle_migrations` — harmless, auto-migrated

---

## 6. ADR: Idempotent Migration Execution

### Status: Accepted

### Context
When `auto_sync_local_data_on_first_setup` copies a local database (created by `drizzle-kit push`) to production, the database has all schema objects but zero migration tracking entries. The migration runner must handle this state.

### Decision
Make the migration runner idempotent:
- `CREATE TABLE` to `CREATE TABLE IF NOT EXISTS`
- `CREATE [UNIQUE] INDEX` to `CREATE [UNIQUE] INDEX IF NOT EXISTS`
- `ALTER TABLE ADD COLUMN` duplicate caught and skipped via `isAlreadyExistsError()`
- Per-migration transactions preserve partial progress

### Consequences
- Setup works whether DB is fresh or synced from local
- Retries after partial failures work (per-migration tracking)
- On synced DBs, migration 0001 table-rewrite (DROP + RENAME `portfolio_items`) replays — data is preserved but `metadata` column (added via `db:push` only, no migration) is lost. This is a pre-existing schema drift issue.

---

## 7. Preventive Measures

1. **Never hand-author migration timestamps.** Use `drizzle-kit generate` which produces monotonically increasing timestamps.
2. **Every schema change must have a migration file.** The `metadata` column on `portfolio_items` was added via `db:push` with no migration — this causes schema drift between local and production.
3. **PM framework changes must propagate atomically.** Use the PM contribution system (`pm_contribute_export` / `pm_contribute_apply`).
4. **Validate `_journal.json` at build time.** A pre-build check should verify `when` values are monotonically increasing.
