# Layer 4 — DevOps / Deploy Audit Findings

**Date:** 2026-08-10
**Scope:** PM2 (app-nuxt/) vs PM3 (app/) — DevOps, Ansible, Docker, scripts, monitoring, backup

---

## 1. Ansible/Docker Parity

### 1.1 File-by-File Comparison

| Component | PM2 Path | PM3 Path | Parity? | Notes |
|-----------|----------|----------|---------|-------|
| `ansible.cfg` | `ansible/ansible.cfg` | `ansible/ansible.cfg` | **IDENTICAL** | Byte-for-byte copy |
| `ansible/README.md` | `ansible/README.md` | `ansible/README.md` | **IDENTICAL** | Still says "PuppetMaster2", "pm_pu.sh", "puppetmaster2-app" |
| `deploy.yml` | `ansible/deploy.yml` | `ansible/deploy.yml` | **IDENTICAL** | Same references to `puppetmaster2_data`, `puppetmaster2-app` |
| `provision-shared.yml` | `ansible/provision-shared.yml` | `ansible/provision-shared.yml` | **IDENTICAL** | Byte-for-byte copy |
| `rollback-app.yml` | `ansible/rollback-app.yml` | `ansible/rollback-app.yml` | **IDENTICAL** | Byte-for-byte copy |
| `requirements.yml` | `ansible/requirements.yml` | `ansible/requirements.yml` | **IDENTICAL** | community.docker >= 4.0.0 |
| `roles/common/tasks/main.yml` | same path | same path | **IDENTICAL** | Installs Node 22, sqlite3, ffmpeg, zstd |
| `roles/security/tasks/main.yml` | same path | same path | **IDENTICAL** | UFW + fail2ban + SSH hardening |
| `roles/docker/tasks/main.yml` | same path | same path | **IDENTICAL** | Docker + Docker Compose plugin |
| `roles/monitoring/tasks/main.yml` | same path | same path | **IDENTICAL** | Netdata install + bind config |
| `roles/deploy-user/tasks/main.yml` | same path | same path | **IDENTICAL** | Creates deploy user + sudo + docker group |
| `roles/*/handlers/main.yml` | same path | same path | **IDENTICAL** | Restart handlers for docker, ssh, fail2ban, netdata |
| `Dockerfile` | `Dockerfile` | `Dockerfile` | **UPDATED** | SvelteKit-adapted (see §4) |
| `.dockerignore` | `.dockerignore` | `.dockerignore` | **IDENTICAL** | Still says "PuppetMaster2" |
| `scripts/deploy.sh` | `scripts/deploy.sh` | `scripts/deploy.sh` | **IDENTICAL** | 414 lines, identical |
| `scripts/setup.sh` | `scripts/setup.sh` | `scripts/setup.sh` | **IDENTICAL** | 593 lines, identical |
| `scripts/lib/deploy-env.sh` | same path | same path | **IDENTICAL** | Same env var resolution |
| `scripts/lib/deploy-registry.sh` | same path | same path | **IDENTICAL** | SSH registry tunnel logic |
| `scripts/docker-entrypoint.sh` | same path | same path | **UPDATED** | SvelteKit: runs `node .output/server/index.mjs` vs Nuxt's `node .output/server/index.mjs` |
| `scripts/backup-db.sh` | same path | same path | **IDENTICAL** | 274 lines, identical |
| `scripts/restore-db.sh` | same path | same path | **IDENTICAL** | 363 lines, identical |
| `scripts/rollback.sh` | same path | same path | **IDENTICAL** | Byte-for-byte copy |
| `scripts/docker-migrate.mjs` | same path | same path | **IDENTICAL** | 193 lines, same Drizzle migration runner |

### 1.2 PM2-Only Files (Missing from PM3)

| File | Description | Severity |
|------|-------------|----------|
| `ansible/deploy-vars.yml` | **Pre-existing** deploy vars template checked into PM2 repo | Important |
| `ansible/inventory.yml` | Actual inventory (PM2 has both `.example.yml` and `.yml`; PM3 has only `.example.yml`) | Important |
| `ansible/known_hosts` | SSH known hosts file | Nice-to-have |

#### Impact of missing `deploy-vars.yml`
PM2's `ansible/deploy-vars.yml` acts as a template populated by `setup.sh`/`deploy.sh` via `render_ansible_deploy_vars_file()`. PM3 has no such file — the scripts will generate one at runtime, but having none means:
- A first-time deployer has no reference for what shape the generated file should take
- If the generation function has bugs, there's no baseline to compare against

### 1.3 Assessment

**Verdict: Stale copies, not true parity.** The entire `ansible/` directory and all shell scripts (except `Dockerfile` and `docker-entrypoint.sh`) were copied verbatim from PM2. Every reference to "puppetmaster2", "PuppetMaster2", "pm_pu", "Nuxt", `puppetmaster2_data` volume, `puppetmaster2-app` image name, and `nuxt` user persists in PM3.

**This is NOT a functional problem** — the deploy still works because the scripts are data-driven from `.env`. But it IS a maintainability problem: an AI agent reading `ansible/deploy.yml` would see `DATA_VOLUME="${PM_DEPLOY_DATA_VOLUME:-puppetmaster2_data}"` and incorrectly conclude PM3 uses PM2 volume names.

---

## 2. Docs-vs-Scripts Drift Table

| # | Doc Reference | Claims | Actual Script/State | Drift? | Severity | Fix |
|---|---------------|--------|---------------------|--------|----------|-----|
| 1 | `ansible/README.md:37` | `npm run setup` | **No `setup` script in `package.json`** | **CRITICAL** | Critical-Functional | Add `"setup": "bash scripts/setup.sh"` to package.json |
| 2 | `ansible/README.md:43` | `npm run deploy` | EXISTS: `"deploy": "bash scripts/deploy.sh"` | None | — | — |
| 3 | `ansible/README.md:title+body` | "PuppetMaster deployment", references `puppetmaster2-app` etc. | PM3 uses SvelteKit, not Nuxt | **DOC STALE** | Important | Update to PM3 terminology |
| 4 | `README.md:193` | `npm run setup` | Same as #1 — no script | **CRITICAL** | Critical-Functional | Same as #1 |
| 5 | `README.md:194` | `npm run deploy` | EXISTS | None | — | — |
| 6 | `README.md:195` | `npm run rollback` | EXISTS: `"rollback": "bash scripts/rollback.sh"` **(in scripts/ but NOT in package.json)** | **CRITICAL** | Critical-Functional | Add `"rollback": "bash scripts/rollback.sh"` to package.json |
| 7 | `README.md:196` | `npm run deploy:logs` | EXISTS: `"deploy:logs": "bash scripts/deploy-logs.sh"` **(in scripts/ but NOT in package.json)** | **CRITICAL** | Critical-Functional | Add `"deploy:logs": "bash scripts/deploy-logs.sh"` to package.json |
| 8 | `README.md:201` | `docs/operations/deployment.md` | File does **NOT** exist at this path | **CRITICAL** | Critical-Functional | The file is in `docs/archive/pm-v2/operations/deployment.md`. Either move it or fix the link. |
| 9 | `README.md:1` | "Puppet Master Vanilla Baseline" | README is the PM vanilla baseline README, NOT a project README | Important | Important | Replace with project-specific README or add project section |
| 10 | `README.md:57` | References Nuxt-specific paths: `app/components/`, `app/assets/css/`, `server/` | PM3 uses SvelteKit: `src/`, `src/lib/components/` | **DOC STALE** | Important | Update paths to SvelteKit structure |
| 11 | `README.md:134` | `project/puppet-master.config.ts` | PM3 uses `src/lib/config/site.ts` | **DOC STALE** | Important | Update config path |
| 12 | `README.md:164` | `i18n/content.ts` | PM3 uses `i18n/db-translations.json` + Paraglide | **DOC STALE** | Important | Update i18n paths |
| 13 | `README.md:92-96` | `npm run db:push`, `npm run db:seed`, `npm run dev` | All three exist and work | None | — | — |
| 14 | `README.md:174-177` | `npm run lint`, `npm run test:run`, `npm run build` | `test:run` does NOT exist. Tests use `npm test` (vitest run) | Minor | Nice-to-have | Fix test command reference |
| 15 | `scripts/backup-db.sh:1-4` | Header says "PuppetMaster2" | Script is stale copy | Minor | Nice-to-have | Update header |
| 16 | `scripts/restore-db.sh:1-4` | Header says "PuppetMaster2", references `puppetmaster2-app` container | Script is stale copy, container name `PM_APP_CONTAINER_NAME` defaults to `puppetmaster2-app` | Important | Important | Update default container name |
| 17 | `.dockerignore:2` | Header says "PuppetMaster2" | Stale copy | Minor | Nice-to-have | Update header |
| 18 | `.dockerignore:12-13` | References `.nuxt` directory | PM3 uses `.svelte-kit` not `.nuxt` | None (both excluded) | — | — |
| 19 | `.env.example:102-127` | References `puppetmaster2-app`, `puppetmaster2` nodes | Stale PM2 names | Minor | Nice-to-have | Update defaults to PM3 names |

### 2.2 `npm run setup` — The Most Critical Drift

Per the scope doc explicitly noting "ansible/README.md instructs `npm run setup` but package.json may have no `setup` script":

**Confirmed: PM3 package.json has NO `setup` script.** PM2 has `"setup": "bash scripts/setup.sh"`. The `scripts/setup.sh` file DOES exist in PM3 (identical 593-line copy), but there is no npm script to invoke it.

This means:
- `npm run setup` → `npm error: Missing script: "setup"`
- The documented bootstrap flow is broken
- A new deployer following the docs will fail at step 1

---

## 3. Deploy Script End-to-End Trace

### 3.1 Flow

Both `deploy.sh` (PM3 and PM2) are identical 414-line bash scripts. Here's the end-to-end trace:

```
deploy.sh
│
├── Stage 1: load environment
│   ├── load_env() — sources .env via load_dotenv_file()
│   ├── require_completed_setup_state() — checks .pm-deploy-state.json exists
│   └── Sets: DATA_VOLUME, DEPLOY_AUTH_MODE, DEPLOY_USER_NAME
│
├── Stage 2: preflight validation
│   ├── Validates required: SITE_DOMAIN, SERVER_IP, ACME_EMAIL, DEPLOY_USER_PASSWORD
│   ├── Validates PM_SETTINGS_ENCRYPTION_KEY (64+ char hex)
│   ├── Validates PM_DEPLOY_DATABASE_URL (must be inside /app/data)
│   ├── Validates PM_DEPLOY_SCHEMA_MODE (compatible|maintenance)
│   ├── Checks: ansible-playbook, ansible-galaxy, docker, ssh-keyscan, ssh-keygen, curl, git, node
│   ├── Resolves: DEPLOY_VERSION, BUILD_TIMESTAMP, BUILD_SHA, BUILD_BRANCH, BUILD_COMMIT_MESSAGE
│   └── SSH key validation (if SSH_KEY=true)
│
├── Stage 3: host trust + Ansible collection setup
│   ├── bootstrap_known_host_entry() — ssh-keyscan $SERVER_IP
│   └── install_ansible_collections() — ansible-galaxy collection install
│
├── Stage 4: render deploy artifacts + prepare remote registry
│   ├── render_ansible_inventory_file() — generates ansible/inventory.yml
│   ├── render_ansible_deploy_vars_file() — generates ansible/deploy-vars.yml
│   ├── ensure_remote_zstd() — if deploy mode is "local"
│   ├── ensure_remote_ssh_registry() — starts SSH tunnel to registry
│   └── ensure_remote_traefik_image() — pulls traefik image on server
│
├── Stage 5: Docker build
│   └── build_and_push_docker_image() — docker build + tag from .env PM_DOCKER_IMAGE
│
├── Stage 6: Image delivery (one of three modes)
│   ├── ssh-registry: push to server-local registry via SSH tunnel
│   └── local: docker save | zstd | ssh → docker load
│
├── Stage 7: App rollout (Ansible)
│   ├── run_ansible_deploy() — ansible-playbook deploy.yml with runtime + build vars
│   │   └── deploy.yml does:
│   │       ├── Create project directories
│   │       ├── SQLite DB maintenance backup
│   │       ├── Write .env.runtime
│   │       ├── Run drizzle migrations (docker-migrate.mjs)
│   │       ├── Admin password rotation (if enabled)
│   │       ├── Generate docker-compose.yml per project
│   │       ├── docker compose up (recreate: always)
│   │       ├── Record .pm-deploy.json metadata
│   │       └── Prune old Docker images (keep latest 2)
│   └── pm-traefik-config.sh — regenerates composite Traefik config
│
└── Stage 8: post-deploy health check
    └── health_check_with_retries() — curl https://$SITE_DOMAIN/api/health (with retries)
```

### 3.2 Required Environment Variables

Variables that `deploy.sh` REQUIRES (fails without):

| Variable | Source | Validation | Documented in .env.example? |
|----------|--------|------------|---------------------------|
| `SITE_DOMAIN` | .env | Must be non-empty, valid domain | Yes |
| `SERVER_IP` | .env | Must be non-empty | Yes |
| `ACME_EMAIL` | .env | Must be non-empty | Yes |
| `DEPLOY_USER_PASSWORD` | .env | Must be non-empty | Yes |
| `PM_SETTINGS_ENCRYPTION_KEY` (or `SETTINGS_ENCRYPTION_KEY`) | .env | Must be 64+ char hex | Yes |
| `PM_DEPLOY_DATABASE_URL` | .env | Must be inside /app/data | Yes |
| `PM_DEPLOY_SCHEMA_MODE` | .env | Must be "compatible" or "maintenance" | No (only mentioned in comments) |
| `PM_DEPLOY_MAINTENANCE_ACK` | .env | Required when SCHEMA_MODE=maintenance | No (only in comments) |
| `DEPLOY_SSH_KEY` | .env | Required when SSH_KEY=true | Yes |
| `SSH_KEY` | .env | Must be true/false | Yes |
| `DEPLOY_USER` | .env | Must be non-empty | Yes |
| `PM_DOCKER_IMAGE` | .env | Must be non-empty | Yes (defaults to puppetmaster2-app in .env.example) |
| `PM_DOCKER_DEPLOY_MODE` | .env | Must be ssh-registry, local, or remote | Yes |

### 3.3 Undocumented/Missing Variables

| Variable | Where Expected | Documented? | Severity |
|----------|---------------|-------------|----------|
| `TOTP_ENCRYPTION_KEY` | `.env.example:185` declares it | **YES, but NOT passed to runtime by Ansible deploy-vars** | Critical-Functional |
| `PM_DEPLOY_SCHEMA_MODE` | `deploy.sh:283` validates | **NO — only mentioned in .env.example comments, not as a documented variable** | Important |
| `PM_DEPLOY_MAINTENANCE_ACK` | `deploy.sh:283` blocks maintenance mode without it | **NO** | Important |
| `PM_DEPLOY_ANSIBLE_RETRIES` | `setup.sh:296` | **NO** | Nice-to-have |
| `PM_DEPLOY_ANSIBLE_RETRY_DELAY_SECONDS` | `setup.sh:297` | **NO** | Nice-to-have |
| `PM_DEPLOY_DATA_VOLUME` | `deploy.sh:266` defaults to `puppetmaster2_data` | **NO** | Important |
| `DEPLOY_VERSION` | `deploy.sh:299` | **NO** | Nice-to-have |
| `BUILD_TIMESTAMP` | `deploy.sh:300` | **NO** | Nice-to-have |
| `BUILD_SHA` | `deploy.sh:301` | **NO** | Nice-to-have |

### 3.4 TOTP_ENCRYPTION_KEY — Direct Production Boot Blocker

**Evidence basis:** Repo-verified — traced end-to-end across 4 files.

**The problem chain:**

1. **`src/project/site-config.ts:158`** — `FEATURES.twoFactorAuth: true` (active in this project)
2. **`src/hooks.server.ts:30-32`** — fail-fast: `if (FEATURES.twoFactorAuth && production && !TOTP_ENCRYPTION_KEY) throw Error(...)` — the app **crashes at boot** when the key is missing
3. **`scripts/lib/deploy-env.sh:7`** — declares `TOTP_ENCRYPTION_KEY_PLACEHOLDER` but has **no `resolve_totp_encryption_key` function** — the placeholder is never resolved or exported
4. **`ansible/deploy.yml:113-155`** (`.env.runtime` template) — includes `PM_SETTINGS_ENCRYPTION_KEY`, `SMTP_*`, `S3_*`, `API_*`, `REDIS_*` but **does NOT include `TOTP_ENCRYPTION_KEY`** (confirmed: zero TOTP references in the entire playbook)
5. **`ansible/deploy.yml:229-230`** (docker-compose generation) — container uses `.env.runtime` as its only `env_file`

**Runtime consequence:** After every deploy, the Docker container starts without `TOTP_ENCRYPTION_KEY` in its environment. `hooks.server.ts:30-32` evaluates `FEATURES.twoFactorAuth===true && NODE_ENV==='production' && process.env.TOTP_ENCRYPTION_KEY===undefined` → throws → **container crashes at boot and enters a restart loop.**

The key IS generated by `scripts/deploy-secrets.sh:189` and written to the developer's local `.env` file. `deploy.sh` validates it exists. But the Ansible deploy-vars rendering pipeline never passes it through to the container — the key stops at the developer's machine.

**There is no workaround in the current deploy pipeline.** The container cannot boot with `FEATURES.twoFactorAuth: true` (the current config in `src/project/site-config.ts:158`) because the Ansible `.env.runtime` template at `ansible/deploy.yml:113-155` omits `TOTP_ENCRYPTION_KEY`. The `deploy-env.sh` placeholder at line 7 is never resolved. The container starts, `hooks.server.ts:30-32` evaluates the missing key, throws, and the container enters a restart loop. The only way to deploy successfully today is to set `FEATURES.twoFactorAuth: false` in `site-config.ts` before running `npm run deploy`.

---

## 4. Build Configuration

### 4.1 Dockerfile (PM3)

**Rating: GOOD with minor issues.**

```
Stage 1 (deps): node:22-alpine3.22
  → Install build deps (python3, make, g++, libc6-compat)
  → npm ci --ignore-scripts → rebuild better-sqlite3

Stage 2 (builder): node:22-alpine3.22
  → Copy node_modules from deps
  → Copy source → npm run build (produces .output/)

Stage 3 (production): node:22-alpine3.22
  → Install runtime deps: libc6-compat, ffmpeg
  → Create non-root user: sveltekit (uid 1001, gid 1001 nodejs)
  → Copy .output, package.json, docker-entrypoint.sh
  → Copy drizzle/ migrations, i18n/system-seed.json, i18n/db-translations.json
  → USER sveltekit (non-root)
  → HEALTHCHECK: wget http://localhost:3000/api/health
  → CMD: ./scripts/docker-entrypoint.sh
```

| Aspect | Status | Notes |
|--------|--------|-------|
| Multi-stage | ✅ Yes | 3 stages: deps, builder, production |
| Node version | ✅ Node 22 (Alpine 3.22) | Pinned explicitly in Dockerfile |
| Non-root user | ✅ sveltekit:nodejs (1001:1001) | Follows security best practices |
| Build-time secrets | ✅ BUILD_* ARGs in production stage only | Preserves Docker cache |
| Health check | ✅ Every 30s, 3 retries | wget-based |
| Cache optimization | ⚠️ Partial | `COPY . .` copies everything including tests, docs |
| `.dockerignore` effectiveness | ⚠️ Weak | Excludes `*.md` and `docs/` but allows some junk |

**PM2 vs PM3 Dockerfile diff summary:**
- PM2: 166 lines (4 stages — adds "development" stage)
- PM3: 112 lines (3 stages — no development stage)
- PM2 user: `nuxt` (uid 1001)
- PM3 user: `sveltekit` (uid 1001)
- PM2 copies: `docker-migrate.mjs`, `ops-agent.mjs`, `rotate-admin-passwords.mjs` 
- PM3 copies: none of the above explicitly (docker-migrate.mjs is in .output/)
- PM2 creates: `data/temp`, scripts/ directories
- PM3: no temp directory creation
- **Both** use identical node:22-alpine3.22 base image

### 4.2 `.dockerignore`

Identical between PM2 and PM3. Excludes:
- ✅ `node_modules`, `data/`, `.env`, `.git`
- ⚠️ `*.md` and `docs/` — may exclude needed documentation from the image
- ⚠️ References `.nuxt` (Nuxt-specific) but PM3 uses `.svelte-kit` — however both are excluded so it's harmless
- ⚠️ Does NOT exclude: `.kilo/`, `.husky/`, `.nocowboy/`, `build/`, `contributing/`, `legal/`, `project/`, `messages/`, `playwright.config.ts`, `lighthouserc.js`
- ❌ **Does NOT exclude `ansible/`** — the entire Ansible directory is copied into the Docker build context unnecessarily

### 4.3 `vite.config.ts`

```ts
plugins: [tailwindcss(), sveltekit(), paraglide({...})]
```

No production-specific optimizations:
- No `build.minify` override (defaults to esbuild, OK)
- No `build.target` specification
- No CSS code splitting configuration
- No chunk size warnings threshold
- No manual chunk splitting for vendor libraries

### 4.4 `svelte.config.js`

```js
adapter: adapter()  // @sveltejs/adapter-node — no options passed
```

- No custom `out` directory
- No `precompress` option (no gzip/brotli precompression at build time)
- CSP: Nonce-based, good directives — NO `frame-ancestors 'none'` which is correct for onepager
- `style-src-attr 'unsafe-inline'` is a documented narrow exception for SvelteKit body wrapper and LoadingBase skeleton widths

**Missing adapter-node options:**
```js
adapter: adapter({
  out: 'build',           // Not needed (default .output is fine)
  precompress: true,      // Would reduce cold-start latency
  envPrefix: 'PUBLIC_'    // Not needed (SvelteKit handles PUBLIC_ prefix)
})
```

---

## 5. Monitoring & Observability

### 5.1 Current State vs PM2

| Capability | PM2 | PM3 | Status |
|------------|-----|-----|--------|
| **Error tracking (Sentry)** | `@sentry/node` ^9.17.0 | **NOT PRESENT** | **MISSING** |
| **Frontend error tracking** | `@sentry/vue` ^9.17.0 | **NOT PRESENT** | **MISSING** |
| **Structured logging** | pino ^10.1.0 | pino ^10.1.0 | ✅ Present (but may not be wired into request pipeline) |
| **Server metrics (Netdata)** | Ansible monitoring role installs | **SAME** | ✅ Present |
| **Health endpoint** | `/api/health` returns JSON | `/api/health` returns `{status:'ok', timestamp, uptime}` | ✅ Present |
| **Health check depth** | Returns DB status, build info | Returns uptime only | ⚠️ Shallow — no DB connectivity check, no migration status |
| **Docker health check** | wget /api/health | wget /api/health | ✅ Present |
| **Ops agent** | `scripts/ops-agent.mjs` | `scripts/ops-agent.mjs` exists | ✅ Present (identical copy) |
| **Admin monitoring panel** | Netdata iframe in admin | Netdata iframe in admin | ✅ Present (same) |
| **Uptime Kuma** | Configurable via .env | Configurable via .env | ✅ Present |
| **Dockge dashboard** | Port 5001 (Ansible installs) | Port 5001 (Ansible installs) | ✅ Present |

### 5.2 Health Endpoint Assessment

`src/routes/api/health/+server.ts`:

```ts
export function GET(event: RequestEvent) {
  return new Response(JSON.stringify(jsonSuccess({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })))
}
```

Issues:
- **No database health check** — doesn't verify SQLite connectivity
- **No migration status** — doesn't report pending/run migrations
- **No build version in response** — doesn't include BUILD_VERSION/BUILD_SHA
- **No memory metrics** — doesn't report heap usage
- `uptime` is `process.uptime()` not `os.uptime()` — this is the Node.js process uptime, not system uptime. Acceptable but ambiguous naming.

### 5.3 Sentry Gap — Operational Hardening Regression

**Evidence basis:** Parity comparison. PM2 has `@sentry/node` ^9.17.0 + `@sentry/vue` ^9.17.0 in `package.json`. PM3 has neither Sentry package. Verified by `package.json` diff.

This is an **operational hardening gap**, not a direct security vulnerability. The application functions correctly without Sentry. Impact:
- No JavaScript error tracking in production
- No performance monitoring
- No release tracking
- Attack/error detection relies on pino log analysis alone

**Config context:** This project runs in `PM_MODE: 'build'` (`site-config.ts:215`) — production-like mode where error monitoring would be valuable.

---

## 6. Backup & Recovery

### 6.1 Existing Backup Mechanisms

| Mechanism | Location | Trigger | Scope |
|-----------|----------|---------|-------|
| `scripts/backup-db.sh` | PM3 scripts/ | Manual or cron | Full SQLite backup with integrity check, optional compression + encryption + S3 upload |
| `scripts/restore-db.sh` | PM3 scripts/ | Manual | Restore from local file, --latest, or --from-s3 |
| Ansible pre-migration backup | `ansible/deploy.yml:92-103` | Automatic (on `PM_DEPLOY_SCHEMA_MODE=maintenance` only) | SQLite `.backup` to `/home/deploy/backups/<project>/` |
| Rollback image markers | `ansible/deploy.yml:284-328` | Automatic (every deploy) | Saves `current-image` and `previous-image` for `rollback-app.yml` |

### 6.2 Backup Script Quality

`backup-db.sh` is a well-written 274-line script with:
- ✅ WAL-safe backup via `sqlite3 .backup`
- ✅ Integrity check via `PRAGMA integrity_check`
- ✅ gzip compression
- ✅ Optional AES-256-CBC encryption with PBKDF2
- ✅ Optional S3 upload with retention cleanup
- ✅ Weekly vs daily backup differentiation
- ✅ Cron examples in header comments

### 6.3 What's Missing

| Gap | Severity | Notes |
|-----|----------|-------|
| **No cron job installed automatically** | Critical-Functional | Ansible roles do NOT install a cron job for DB backups. The backup script recommends `0 2 * * *` in its header comments but nothing sets it up. |
| **No backup rotation for Ansible-created backups** | Important | deploy.yml creates backups on maintenance mode but never prunes old ones |
| **No uploads backup** | Important | Only DB is backed up. Uploaded user files in `/app/uploads` are not backed up. |
| **No backup verification automation** | Nice-to-have | `--verify` flag exists but no automated verify-then-alert pipeline |
| **Restore script container name** | Important | Defaults to `puppetmaster2-app` — must be configured via `PM_APP_CONTAINER_NAME` for PM3 |
| **No backup monitoring/alerting** | Important | No health check for "last backup timestamp" |

### 6.4 PM2 Parity

PM2 has the identical backup scripts. Neither PM2 nor PM3 installs cron jobs automatically — both rely on manual operator setup.

---

## 7. Manual Verification Checklist

Run these commands on the live production server after PM3 deployment:

### Container & Image
- [ ] `docker ps --filter name=pm-` — List running PM containers
- [ ] `docker images | grep pm-` — Verify image versions
- [ ] `docker inspect pm-<project>-app | jq '.[0].Config.Image'` — Confirm running image tag
- [ ] `docker logs pm-<project>-app --tail 50` — Check for startup errors

### TLS & DNS
- [ ] `curl -sI https://<domain>/ | head -5` — TLS cert status
- [ ] `echo | openssl s_client -connect <domain>:443 -servername <domain> 2>/dev/null | openssl x509 -noout -dates` — Cert expiry date
- [ ] `dig +short <domain>` — DNS resolves to server IP

### Firewall (UFW)
- [ ] `sudo ufw status verbose` — Confirm rules: SSH(22), HTTP(80), HTTPS(443) only
- [ ] `sudo ufw status numbered` — List all numbered rules

### Environment Variables (in running container)
- [ ] `docker exec pm-<project>-app env | sort` — All env vars visible to app
- [ ] `docker exec pm-<project>-app env | grep -E 'NODE_ENV\|DATABASE_URL\|SITE_DOMAIN\|BUILD_'` — Core vars
- [ ] Verify `PM_SETTINGS_ENCRYPTION_KEY` is set (not empty, not placeholder)
- [ ] Verify `TOTP_ENCRYPTION_KEY` is set (if 2FA enabled)

### CSP Headers
- [ ] `curl -sI https://<domain>/ | grep -i content-security-policy` — CSP header served
- [ ] Verify CSP contains `script-src 'self'` with nonce (not `'unsafe-inline'`)
- [ ] Verify CSP contains `frame-ancestors 'none'`
- [ ] Verify CSP contains `object-src 'none'`
- [ ] `curl -sI https://<domain>/ | grep -i x-frame-options` — Should be DENY or absent (frame-ancestors in CSP)
- [ ] `curl -sI https://<domain>/ | grep -i strict-transport-security` — HSTS header

### Database
- [ ] `ls -la /home/deploy/app/shared/<project>/data/sqlite.db` — DB file exists, size
- [ ] `sqlite3 /home/deploy/app/shared/<project>/data/sqlite.db "PRAGMA integrity_check;"` — DB integrity
- [ ] `sqlite3 /home/deploy/app/shared/<project>/data/sqlite.db "SELECT COUNT(*) FROM users;"` — User count
- [ ] `ls -la /home/deploy/app/shared/<project>/data/sqlite.db-wal` — WAL file exists (normal for SQLite)

### Backups
- [ ] `ls -lt /home/deploy/backups/<project>/ | head -5` — Last backup files
- [ ] `cat /home/deploy/app/stacks/<project>/latest-db-backup 2>/dev/null` — Last deploy backup path
- [ ] `stat /home/deploy/backups/<project>/ | grep Modify` — Last backup timestamp
- [ ] `crontab -l -u deploy | grep backup` — Verify backup cron job exists
- [ ] `crontab -l -u root | grep backup` — Check root cron too

### Monitoring
- [ ] `curl -s http://localhost:19999/api/v1/info | jq` — Netdata API reachable
- [ ] `systemctl status netdata` — Netdata running
- [ ] `docker inspect pm-traefik | jq '.[0].State.Health'` — Traefik health
- [ ] `docker inspect pm-registry | jq '.[0].State.Status'` — Registry running
- [ ] Health endpoint: `curl -s https://<domain>/api/health | jq` — Should return `{"success":true,"data":{"status":"ok",...}}`

### System
- [ ] `df -h /` — Disk space on root partition (>20% free)
- [ ] `df -h /home` — Disk space on home partition
- [ ] `free -h` — Available memory
- [ ] `docker system df` — Docker disk usage
- [ ] `uptime` — System uptime
- [ ] `node --version` — Node.js version (should be 22.x)

### Docker-specific
- [ ] `docker network ls | grep pm-shared` — Shared network exists
- [ ] `docker volume ls` — Named volumes present
- [ ] `docker compose -f /home/deploy/app/stacks/<project>/docker-compose.yml config` — Validate compose file

---

## 8. Stack Fit for Deploy

### 8.1 Current Stack Summary

```
Developer laptop → bash scripts → SSH → Ansible → Docker Compose → Traefik → App Container
                         ↓
                   Docker build (local)
                         ↓
              SSH tunnel → Private registry → docker pull OR
              docker save | zstd | ssh → docker load
```

**Components:** bash (~800 lines shared libs), Ansible (5 roles + 2 playbooks), Docker (multi-stage build), Traefik (reverse proxy + Let's Encrypt), Dockge (web UI), Netdata (monitoring), private Docker registry

### 8.2 AI-Agent Maintainability Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| **Shell script complexity** | ⚠️ MEDIUM | deploy.sh + setup.sh are well-structured but 1000+ lines of bash. An agent can maintain them but must understand SSH tunnels, Ansible var rendering, and Docker stream modes. |
| **Ansible declarativeness** | ✅ GOOD | YAML-based, idempotent. Agents understand declarative config well. |
| **CI/CD absence** | ⚠️ WEAK | Manual deploy from dev laptop. No CI pipeline, no automated testing, no canary deployments. Increases risk of agent-caused production issues. |
| **Error recovery** | ⚠️ WEAK | Rollback script exists but only swaps images — doesn't revert DB schema. Recovery guidance printed to stderr, but no automated recovery. |
| **Secrets management** | ⚠️ WEAK | Everything in `.env` file. No vault, no sealed secrets, no AWS Secrets Manager. Agent must manually manage encryption keys. |
| **Environment drift** | ⚠️ MEDIUM | Ansible ensures server state is idempotent, but `.env` on developer laptop is the single source of truth. No way to verify server env matches local .env. |
| **Dependency chain** | ⚠️ COMPLEX | ansible → ansible-galaxy → community.docker → docker compose v2 → python3-docker SDK. Deep dependency tree. |
| **Multi-project isolation** | ✅ GOOD | Shared VPS model with per-project docker-compose stacks, separate data directories. |

### 8.3 Alternative: Docker Compose + GitHub Actions

**Simpler approach for AI-driven dev:**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: workflow_dispatch
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_IP }}
          script: |
            docker pull ghcr.io/${{ github.repository }}:${{ github.sha }}
            docker compose -f /home/deploy/app/stacks/<project>/docker-compose.yml up -d
            docker image prune -f
```

### 8.4 Trade-offs

| Dimension | Current (Ansible + bash + SSH registry) | Simplified (Compose + GHA + GHCR) |
|-----------|----------------------------------------|-----------------------------------|
| **Setup complexity** | HIGH — needs ansible, python, ssh keys, docker, ansible-galaxy on dev machine | LOW — needs Docker on server, GHA on repo |
| **Agent maintainability** | ⚠️ 800+ lines of bash, 500+ lines of Ansible YAML | ✅ ~30 lines of GHA YAML + simple docker compose |
| **Secrets** | `.env` on dev laptop — single point of failure | GitHub Secrets + server `.env` |
| **Deploy speed** | Medium (local build + push) | Medium (CI build + pull) |
| **Offline deploy** | ✅ Possible (local build + direct stream) | ❌ Requires GitHub/Docker Hub access |
| **Rollback** | Ansible rollback (image swap only) | `docker compose up -d` with previous tag |
| **Schema migrations** | ✅ Built-in via docker-migrate.mjs | ✅ Same script, run via SSH |
| **Multi-project VPS** | ✅ Built into Ansible (shared infrastructure) | Needs manual setup per project |
| **Traefik config** | ✅ Auto-generated by pm-traefik-config.sh | Needs manual Traefik label or file config |
| **Monitoring** | ✅ Netdata + Dockge via Ansible | Needs separate setup |
| **CI/CD visibility** | ❌ None — manual `npm run deploy` | ✅ Full GitHub Actions log |
| **Third-party dependency** | None (self-hosted registry on server) | GitHub Container Registry (or Docker Hub) |
| **TLS cert automation** | ✅ Traefik + Let's Encrypt (same in both) | Same |

### 8.5 Recommendation

For an AI-agent-driven development workflow, the current stack is **over-engineered for the scale**. Key issues:

1. **`npm run setup` doesn't exist** — the bootstrap is broken before any deploy can happen
2. **800+ lines of bash scripts** are challenging for an agent to maintain safely
3. **No CI** means no automated testing gates before deploy
4. **Manual .env management** is error-prone for agents

However, the current stack has **real advantages for multi-project VPS hosting** that a simple GHA workflow wouldn't replicate (shared Traefik, private registry, Dockge dashboard, Netdata monitoring).

**Suggested path forward:**
1. **Fix critical blockers first** — restore missing npm scripts, fix docs
2. **Add a CI pipeline** alongside the existing manual deploy (don't replace, augment)
3. **Extract env validation** into a standalone script agents can run pre-deploy
4. **Keep Ansible for initial server provisioning** (it's good at this)
5. **Consider replacing Ansible deploy with direct `docker compose` commands** for the actual app rollout

---

## Summary

### Findings by Severity

#### Critical-Functional (6 findings)

| # | Evidence | Finding | Detail |
|---|----------|---------|--------|
| 1 | **Repo-verified** | **TOTP_ENCRYPTION_KEY blocked at Ansible — container crashes at boot** | §3.4 — `FEATURES.twoFactorAuth: true` (`site-config.ts:158`) triggers `hooks.server.ts:30-32` boot crash. Key generated locally by `deploy-secrets.sh:189` but `ansible/deploy.yml:113-155` `.env.runtime` template omits `TOTP_ENCRYPTION_KEY` entirely (zero TOTP references in playbook). Container uses `.env.runtime` as sole env source (`deploy.yml:229-230`). Result: app boot-crashes after every deploy. Only workaround: disable `FEATURES.twoFactorAuth`. |
| 2 | **Repo-verified** | `npm run setup` missing from package.json | §2.1 #1 — Documented bootstrap command does not exist. `scripts/setup.sh` exists but no npm script. |
| 3 | **Repo-verified** | `npm run rollback` missing from package.json | §2.1 #6 — Documented but not wired. |
| 4 | **Repo-verified** | `npm run deploy:logs` missing from package.json | §2.1 #7 — Same. |
| 5 | **Repo-verified** | `docs/operations/deployment.md` referenced but missing | §2.1 #8 — File archived in `docs/archive/pm-v2/`. Broken link in README. |
| 6 | **Repo-verified** | No automated DB backup cron job | §6.3 — `backup-db.sh` (274 lines) has cron examples in headers but nothing installs a cron job. |

#### Important (8 findings)

| # | Evidence | Finding | Detail |
|---|----------|---------|--------|
| 7 | **Parity comparison** | No Sentry error tracking | §5.3 — PM2 had `@sentry/node` + `@sentry/vue`. PM3 has neither. Operational hardening gap. |
| 8 | **Repo-verified** | `ansible/` directory unmodified PM2 copy | §1.3 — All references to "PuppetMaster2", "puppetmaster2-app", "nuxt" persist in Ansible roles and playbooks. |
| 9 | **Repo-verified** | README.md is PM vanilla baseline | §2.1 #9-12 — Config, component, and i18n paths all reference PM2 structure. |
| 10 | **Repo-verified** | `PM_DEPLOY_DATA_VOLUME` defaults to `puppetmaster2_data` | §1.3 — Legacy PM2 volume name in deploy script defaults. |
| 11 | **Repo-verified** | Health endpoint too shallow | §5.2 — No DB check, no migration status, no build version. Returns `{ status: 'ok', timestamp, uptime }` only. |
| 12 | **Repo-verified** | `restore-db.sh` defaults to `puppetmaster2-app` container | §2.1 #16 — Must set `PM_APP_CONTAINER_NAME` env var for PM3. |
| 13 | **Repo-verified** | Undocumented env vars | §3.3 — `PM_DEPLOY_SCHEMA_MODE`, `PM_DEPLOY_MAINTENANCE_ACK`, `PM_DEPLOY_DATA_VOLUME` not in `.env.example`. |
| 14 | **Repo-verified** | No uploads backup | §6.3 — Only DB backed up. Uploaded files in `/app/uploads` are excluded. |

#### Nice-to-have (5 findings)

| # | Evidence | Finding | Detail |
|---|----------|---------|--------|
| 15 | **Recommendation** | `vite.config.ts` no production optimizations | §4.3 — No precompress, no chunk splitting. |
| 16 | **Recommendation** | svelte.config.js no precompress | §4.4 — `adapter-node` can precompress at build time. |
| 17 | **Repo-verified** | All script headers say "PuppetMaster2" | §2.1 #15 — Cosmetic but confusing for operators. |
| 18 | **Recommendation** | `.dockerignore` allows `ansible/` into build context | §4.2 — Wasteful but harmless. |
| 19 | **Recommendation** | Docker 256M memory limit is tight | §1 — Node.js + better-sqlite3 + sharp may need more under load. |

### Quick Wins (Top 5 Actions)
1. **Add `TOTP_ENCRYPTION_KEY` to Ansible `.env.runtime` template** — Add `TOTP_ENCRYPTION_KEY={{ totp_encryption_key }}` to `ansible/deploy.yml:113-155` `.env.runtime` template and wire it through the deploy-vars rendering chain so the key reaches the container. Without this, the app crashes at boot when `FEATURES.twoFactorAuth: true` (current config).
2. Add `"setup": "bash scripts/setup.sh"`, `"rollback": "bash scripts/rollback.sh"`, `"deploy:logs": "bash scripts/deploy-logs.sh"` to package.json scripts
3. Install a cron job for `backup-db.sh --remote` during server provisioning
4. Install Sentry (`@sentry/node` + `@sentry/sveltekit`) for production error tracking (operational hardening)
5. Fix broken `docs/operations/deployment.md` link in README
