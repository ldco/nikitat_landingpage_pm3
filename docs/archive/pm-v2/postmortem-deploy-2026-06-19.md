# Postmortem: nikitat.pro Deploy — 2026-06-19

**Duration:** ~8 hours of iterative fixes  
**Root class:** All 7 issues are project-specific drift from PM framework baseline — not Puppet Master bugs.

---

## Issue 1: Migration runner uses timestamp comparison

- `scripts/docker-migrate.mjs` determined pending migrations by comparing `created_at < entry.when`
- Migration 0002 was hand-authored with `when: 1737244800000` (Jan 2025) — 11 months before 0000/0001
- **Result:** migration 0002 silently skipped on all projects, 2FA schema never applied
- **Fix:** switched to `entry.idx > lastIdx` (journal index), backfilled legacy tracking

## Issue 2: Migration runner single-transaction failure

- All pending migrations ran inside ONE SQLite transaction
- If any migration failed (e.g. table already exists), the entire transaction rolled back — no tracking recorded
- **Result:** on retry, ALL migrations considered pending again, creating infinite failure loop
- **Fix:** per-migration transactions — each entry commits independently

## Issue 3: CREATE TABLE/INDEX not idempotent

- When local DB (created via `db:push`) was synced to production, all tables existed but tracking was empty
- Migration runner tried to `CREATE TABLE` for already-existing tables → crash
- **Fix:** runtime transformation `CREATE TABLE` → `CREATE TABLE IF NOT EXISTS`, same for `CREATE [UNIQUE] INDEX`
- Added `isAlreadyExistsError` catch for `ALTER TABLE ADD COLUMN` duplicates
- Multiline regex flag `m` to match `CREATE` after SQL comments

## Issue 4: rotate-admin-passwords.mjs missing from Docker image

- `deploy.yml` runs `node scripts/rotate-admin-passwords.mjs` in the container
- `Dockerfile` did not `COPY` this file to the production stage
- **Result:** deploy crashed with `MODULE_NOT_FOUND`
- **Fix:** added COPY line after `ops-agent.mjs`

## Issue 5: setup.sh missing pm-traefik-config.sh stage

- `deploy.sh` calls `pm-traefik-config.sh` after Ansible deploy (regenerates Traefik routing)
- `setup.sh` (used for first-time deploy) did not call it
- **Result:** Traefik had empty routing config → health check got 404
- **Fix:** added `traefik_config_generation` stage in setup.sh, with required env var exports

## Issue 6: Schema drift — no migration for metadata column

- `portfolio_items.metadata` column added to `schema.ts` via `db:push` — no migration file was ever generated
- Migration 0001 does `DROP TABLE portfolio_items; ALTER TABLE __new RENAME TO portfolio_items`
- **Result:** metadata column lost in production, API returned 500
- **Fix:** created migration 0003 (`ALTER TABLE portfolio_items ADD COLUMN metadata TEXT`), committed

## Issue 7: SSH blocked by provider-level filter

- After multiple failed SSH auth attempts from the local IP, the hosting provider (Timeweb) blocked SSH traffic at the network level
- Port 22 was TCP-open but SSH handshake was aborted (`kex_exchange_identification: Connection closed`)
- fail2ban was not the cause (IP not in banned list, `MaxStartups` not exceeded)
- **Workaround:** built Docker image locally, uploaded to temp.sh, loaded on server via console
- **Prevention:** add IP to permanent allowlist at provider level, or use VPN with static IP

---

## Root Cause Summary

Every issue was caused by one of:

1. **Hand-authored migrations** (0002 timestamp, missing column migrations) — use `drizzle-kit generate` exclusively
2. **Project-specific file drift** (Dockerfile, setup.sh diverging from PM baseline) — propagate all changes atomically via `pm_contribute_export`
3. **Local workflow vs production pipeline mismatch** (`db:push` instead of migrations) — always generate migrations for schema changes

The Puppet Master deploy pipeline itself (Ansible playbooks, Traefik, Docker Compose, migration runner architecture) was correct. The bugs were in the unmodified project files that had drifted from framework defaults.

---

## Prevention Checklist

- [ ] Every schema change → `drizzle-kit generate` → migration file + journal updated  
- [ ] After any change to `Dockerfile`, `setup.sh`, `docker-migrate.mjs` → propagate to ALL projects immediately  
- [ ] Pre-deploy: `node --check scripts/docker-migrate.mjs`  
- [ ] Pre-deploy: verify `_journal.json` timestamps are monotonically increasing  
- [ ] Provider firewall: whitelist deploy IP to prevent SSH blocking  
