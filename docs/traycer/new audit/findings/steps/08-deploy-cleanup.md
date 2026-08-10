# Step 08 — Deploy cleanup: Ansible PM2 names, README, volumes, health endpoint, restore script, env docs, backup cron

> **Phase:** Short-term (Important) | **Findings:** I-11, I-12, I-13, I-14, I-15, I-16, I-17 | **Severity:** Functional

## What this step is

This step eliminates the PM2-era drift in the deployment layer. The entire `ansible/` directory, `scripts/`, `.dockerignore`, and README were copied verbatim from PM2 and still reference "PuppetMaster2", `puppetmaster2-app`, `puppetmaster2_data`, and the `nuxt` user. It also deepens the health endpoint, fixes the restore script's container default, documents the undocumented env vars, and installs an automated DB backup cron.

## What we are doing

1. **I-11:** Rebrand Ansible roles/playbooks/vars from PM2 → PM3 (image name, volume name, deploy user, project naming).
2. **I-12:** Rewrite `README.md` to be project-specific (drop the PM vanilla baseline content and stale PM2 paths).
3. **I-13:** Change `PM_DEPLOY_DATA_VOLUME` default from `puppetmaster2_data` to a PM3 name.
4. **I-14:** Deepen `/api/health` (DB check, build version/commit, memory) — this also satisfies enhancement E-9.
5. **I-15:** Change `scripts/restore-db.sh` default container name from `puppetmaster2-app`.
6. **I-16:** Document `PM_DEPLOY_SCHEMA_MODE`, `PM_DEPLOY_MAINTENANCE_ACK`, `PM_DEPLOY_DATA_VOLUME` (and friends) in `.env.example`.
7. **I-17:** Install a backup cron job during Ansible provisioning (also satisfies E-6).

## Why

- I-11: Repo-verified — `ansible/` is a byte-for-byte PM2 copy; an AI agent reading `deploy.yml` sees `puppetmaster2_data` and wrongly concludes PM3 uses PM2 volume names. Functional today (scripts are `.env`-driven) but a maintainability hazard.
- I-12: `README.md:1` is the PM vanilla baseline README; config/component/i18n paths (`project/puppet-master.config.ts`, `app/components/`, `i18n/content.ts`) are all PM2-era.
- I-13: `deploy.sh:266` defaults the volume to `puppetmaster2_data`.
- I-14: `/api/health` returns only `{status, timestamp, uptime}` — no DB connectivity, no build info.
- I-15: `restore-db.sh` defaults `PM_APP_CONTAINER_NAME` to `puppetmaster2-app`.
- I-16: Several required deploy vars are validated by `deploy.sh` but not documented in `.env.example`.
- I-17: `backup-db.sh` is solid (274 lines) but nothing installs the cron job; backups only happen if an operator manually configures them.

## Plan

### Task 1: Rebrand Ansible + scripts to PM3 (I-11, I-13, I-15)

- **Files:** `ansible/deploy.yml`, `ansible/deploy-vars.yml*`, `ansible/roles/*`, `scripts/deploy.sh`, `scripts/restore-db.sh`, `.dockerignore`
- **Change:** Replace PM2 identifiers (`puppetmaster2-app`, `puppetmaster2_data`, `nuxt` user, "PuppetMaster2" headers) with PM3 equivalents (`pm-<project>-app`, a PM3 volume name, `sveltekit` user). Keep the `.env`-driven override behavior intact — only defaults and references change.

### Task 2: Rewrite README (I-12)

- **File:** `README.md`
- **Change:** Replace the PM vanilla baseline content with a project-specific README: correct config paths (`src/project/site-config.ts`, `src/lib/config/site.ts`), i18n approach (Paraglide + db-translations), commands (including the newly wired `setup`/`rollback`/`deploy:logs` from Step 03), and fix the deployment docs link.

### Task 3: Deepen health endpoint (I-14 + E-9)

- **File:** `src/routes/api/health/+server.ts`
- **Change:** Add a SQLite `SELECT 1` connectivity check (return 503 on failure), include `APP_BUILD_VERSION`/`APP_BUILD_SHA`/`APP_BUILD_TIMESTAMP`, and process memory (`process.memoryUsage()`). Keep the existing response shape for backward compatibility, extending it.

### Task 4: Document env vars (I-16)

- **File:** `.env.example`
- **Change:** Document `PM_DEPLOY_SCHEMA_MODE`, `PM_DEPLOY_MAINTENANCE_ACK`, `PM_DEPLOY_DATA_VOLUME`, `PM_DEPLOY_ANSIBLE_RETRIES`, `PM_DEPLOY_ANSIBLE_RETRY_DELAY_SECONDS` with their valid values and defaults.

### Task 5: Install backup cron (I-17 + E-6)

- **Files:** `ansible/roles/docker/tasks/main.yml` (or a new `roles/backup/tasks/main.yml`), `scripts/backup-db.sh`
- **Change:** Add an Ansible task that installs a cron job (`*/30 * * * * /home/deploy/app/scripts/backup-db.sh --remote --daily` or per the script's header recommendation), configurable via a deploy var. Optionally add S3 offsite destination vars.

## Verification

- [ ] `grep -ri "puppetmaster2" ansible/ scripts/ .dockerignore .env.example` — only legitimate legacy references remain (if any)
- [ ] `npm run check`, `npm run lint` pass (health endpoint change)
- [ ] `curl http://localhost:5173/api/health` — includes `db: 'ok'`, build version, memory; returns 503 when DB unavailable (test by pointing at a bad path)
- [ ] `bash -n scripts/restore-db.sh scripts/deploy.sh` — syntax OK; defaults show PM3 names
- [ ] Deploy to a test host → `crontab -l -u deploy | grep backup` shows the new job
- [ ] README paths resolve; no stale `puppet-master.config.ts` references

## Notes / Risks

- The rebrand must not change runtime behavior — only names/defaults. Keep `.env`-driven overrides working.
- Health endpoint: keep the response backward compatible (additive fields only) so the Docker `HEALTHCHECK` and any external monitors keep working.
- The backup cron should use the same S3 config the script already supports; verify the script's `--remote` flag semantics before wiring.
