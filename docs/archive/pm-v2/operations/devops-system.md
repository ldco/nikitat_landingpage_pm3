# Puppet Master DevOps System — Architecture & Design

## Purpose

This document describes the **complete DevOps subsystem** of the Puppet Master framework — every layer, component, decision, and interaction. It covers the full pipeline from developer workstation to production runtime, including infrastructure provisioning, container orchestration, observability, security hardening, backup/recovery, and the CI/CD guardrails.

Use this document to understand the system as a whole. For step-by-step operator commands, see `docs/operations/deployment.md`. For monitoring specifics, see `docs/operations/monitoring.md`. For multi-project VPS deployment (shared hosting), see `docs/operations/multi-project-deploy.md`.

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPER WORKSTATION                            │
│                                                                          │
│  .env ──────────────────────────────────────────────────────┐           │
│  (single source of truth)                                    │           │
│         │                                                    │           │
│  ┌──────┴──────┐  ┌──────────────────┐  ┌───────────────┐   │           │
│  │ npm run     │  │ Docker Multi-Stage│  │  Ansible      │   │           │
│  │ setup/deploy│──│ Build (4 stages)  │──│  Playbooks    │   │           │
│  │ /rollback   │  │ deps→dev→builder │  │  (provision + │   │           │
│  │             │  │ →production      │  │   deploy)     │   │           │
│  └─────────────┘  └──────────────────┘  └───────┬───────┘   │           │
│                                                  │            │           │
└──────────────────────────────────────────────────┼────────────┘           │
                                                   │                        │
                                          SSH (password or key)             │
                                                   │                        │
┌──────────────────────────────────────────────────┼────────────────────────┐
│                          PRODUCTION VPS (Ubuntu 22.04)                    │
│                                                  │                        │
│  ┌────────────┐     ┌──────────────┐     ┌──────┴───────┐               │
│  │   UFW      │────▶│   Traefik    │────▶│  App Container│              │
│  │  (22,80,   │     │  (port 80,   │     │  (port 3000)  │              │
│  │   443)     │     │   443)       │     │  Node 22 Apl  │              │
│  └────────────┘     └──────────────┘     └──────┬────────┘               │
│                                                  │                        │
│  ┌────────────┐     ┌──────────────┐     ┌──────┴────────┐              │
│  │ fail2ban   │     │ PM Ops Agent │     │ Shared Volumes │              │
│  │ (SSH brute │     │ (sidecar,    │     │ /app/data      │              │
│  │  force)    │     │  Docker sock)│     │ /app/uploads   │              │
│  └────────────┘     └──────┬───────┘     └───────────────┘              │
│                             │                                            │
│  ┌────────────┐     ┌──────┴───────┐     ┌──────────────┐              │
│  │ unattended-│     │ Netdata      │     │ Private      │              │
│  │ upgrades   │     │ (system      │     │ Registry     │              │
│  │ (security) │     │  metrics)    │     │ (localhost   │              │
│  └────────────┘     └──────────────┘     │  :5000)      │              │
│                                           └──────────────┘              │
│  ┌─────────────────────────────────────────┐                            │
│  │ Release Markers: /home/deploy/app/releases/                          │
│  │   current-image, previous-image, current-version,                    │
│  │   previous-version, latest-db-backup                                 │
│  └─────────────────────────────────────────┘                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow: Code → Production

### 2.1 Full Pipeline Sequence

```
Step 1: ENV VALIDATION
  .env → deploy-env.sh → validates all required keys, Docker contract,
  encryption key format, DB path constraints, schema rollout mode

Step 2: HOST TRUST
  ssh-keyscan SERVER_IP → ansible/known_hosts (pinned host key)

Step 3: ANSIBLE ARTIFACT GENERATION
  .env → render_ansible_inventory_file() → ansible/inventory.yml
  .env → render_ansible_deploy_vars_file() → ansible/deploy-vars.yml
  (both are local-only, git-ignored, contain live secrets)

Step 4: SERVER PROVISIONING (first-time only, skipped on deploy)
  ansible-playbook ansible/provision-shared.yml
  ├── role: common      → system updates, essential packages
  ├── role: security    → UFW, fail2ban, unattended-upgrades, SSH hardening
  ├── role: docker      → Docker Engine installation, user group assignment
  ├── role: monitoring  → Netdata (private, localhost + Docker bridge only)
  └── role: deploy-user → creates deploy user, sudo, SSH key setup

Step 5: DOCKER BUILD (on operator machine)
  Dockerfile (4-stage multi-stage build)
  ├── Stage 1 (deps): node:22-alpine, npm ci --ignore-scripts,
  │   rebuilds better-sqlite3 native addon
  ├── Stage 2 (development): full source mount, FFmpeg, npm run dev:host
  ├── Stage 3 (builder): copies deps node_modules, copies source, runs
  │   npm run build (prebuild → assets:launch → assets:optimize →
  │   nuxt build), bakes build args (VERSION, TIMESTAMP, SHA, BRANCH,
  │   COMMIT_MESSAGE) into image as ENV
  └── Stage 4 (production): Alpine, libc6-compat + ffmpeg, creates
      non-root user nuxt:1001, copies only .output, package.json,
      migration files, docker-migrate.mjs, entrypoint, ops-agent,
      i18n seed data. HEALTHCHECK via wget on /api/health

Step 6: IMAGE TRANSFER (one of three modes)

  Mode A: ssh-registry (default)
    1. Start SSH tunnel: local port → server loopback:5000
    2. On server: registry:2 container, binds 127.0.0.1:5000
    3. docker tag → docker push through tunnel (layer-cached)
    4. Ansible pulls image from localhost registry on server
    Result: Only changed layers transfer after first deploy.

  Mode B: local (emergency/air-gapped)
    1. docker save image | zstd -T0 -3 (multi-threaded)
    2. Stream over SSH: | ssh server "zstd -dc | docker load"
    3. No registry required. Full image every time.
    Compression: zstd (default, requires zstd on both sides),
                 pigz, or gzip as fallback.

  Mode C: registry (CI/team deploys)
    1. docker push to external registry (Docker Hub, GHCR, etc.)
    2. Ansible pulls from registry on server
    Requires PM_DOCKER_REGISTRY, PM_DOCKER_USERNAME, PM_DOCKER_TOKEN.

Step 7: ANSIBLE APP ROLLOUT
  ansible-playbook ansible/deploy.yml
  ├── Validates Docker image contract (image ref, tag, network)
  ├── Creates release state dir, shared data/uploads dirs,
  │   Traefik dynamic config dir
  ├── Creates Let's Encrypt acme.json (0600)
  ├── (ssh-registry mode only) Starts private registry:2
  ├── Creates Docker network (PM_APP_NETWORK)
  ├── Detects Docker network gateway for Netdata access
  ├── Migrates legacy named-volume data to shared bind-mounts
  │   (SQLite DB and uploads — one-time, detection-based)
  ├── (maintenance mode) Creates SQLite backup via sqlite3 .backup
  ├── Baseline migration journal for legacy DBs (one-time)
  ├── Runs docker-migrate.mjs inside one-off container
  │   — applies pending Drizzle SQL migrations
  ├── (if enabled) Rotates admin passwords
  ├── Writes .env.runtime (all env vars for app container)
  ├── Writes Traefik dynamic config (routers, TLS, services)
  ├── Recreates app container (or starts new)
  │   — bind-mounts shared/data:/app/data, shared/uploads:/app/uploads
  │   — Docker healthcheck: wget /api/health every 30s, 3 retries
  │   — restart_policy: unless-stopped
  ├── Starts PM Ops Agent sidecar (if enabled)
  ├── Recreates Traefik container
  │   — published ports 80:80, 443:443
  │   — HTTP→HTTPS redirect, Let's Encrypt ACME challenge
  │   — file provider watches /etc/traefik/dynamic/
  ├── Records current/previous image markers
  └── Records current/previous version markers

Step 8: POST-DEPLOY HEALTH CHECK
  curl https://SITE_DOMAIN/api/health (with retries:
    PM_DEPLOY_HEALTH_RETRIES attempts, configurable backoff)
  Fails → prints diagnostics (docker logs, docker ps, curl -vk)
```

### 2.2 Build Metadata Traceability

Every production image carries immutable build identity:

| Metadata Field | Source | Exposed In |
|---|---|---|
| `BUILD_VERSION` | Docker build arg | health endpoints, admin panel |
| `BUILD_TIMESTAMP` | `date -u +%Y-%m-%dT%H:%M:%SZ` | health endpoints, admin panel |
| `BUILD_SHA` | `git rev-parse --short=12 HEAD` | health endpoints, admin panel |
| `BUILD_BRANCH` | `git rev-parse --abbrev-ref HEAD` | admin health detail |
| `BUILD_COMMIT_MESSAGE` | `git log -1 --pretty=%s` | admin health detail |
| `APP_VERSION` | `.env` | health endpoints, admin panel |

The deploy version tag is `{git_sha_short}-{UTC_timestamp}`, e.g. `a1b2c3d4e5f6-20260610220000`.

---

## 3. Infrastructure Stack — Component Reference

### 3.1 Docker Image

| Property | Value |
|---|---|
| Base image | `node:22-alpine3.22` |
| Runtime user | `nuxt:1001` (non-root) |
| Exposed port | 3000 |
| Health check | `wget --no-verbose --tries=1 --spider http://localhost:3000/api/health` |
| Interval | 30s, timeout 3s, start period 10s, retries 3 |
| Entrypoint | `scripts/docker-entrypoint.sh` → ensures DB/uploads dirs → `node .output/server/index.mjs` |
| Key dependencies | FFmpeg (media processing), libc6-compat (glibc compatibility), better-sqlite3 (native SQLite) |
| Volumes | `/app/data` (SQLite DB), `/app/uploads` (user uploads) |

### 3.2 Traefik (Edge Proxy)

| Property | Value |
|---|---|
| Image | `traefik:v3.1` |
| Ports | 80 (HTTP → redirects to 443), 443 (HTTPS) |
| TLS | Let's Encrypt via ACME HTTP challenge |
| Config | File provider: `/etc/traefik/dynamic/puppetmaster2.yml` (watched) |
| Router rule | `Host(\`SITE_DOMAIN\`)` |
| Cert storage | `/letsencrypt/acme.json` (permissions 0600) |
| Middleware | Alias redirect: permanent 301 from SITE_DOMAIN_ALIASES to canonical domain |

### 3.3 PM Ops Agent (Sidecar)

| Property | Value |
|---|---|
| Image | Same as app image |
| Port | 3010 (internal Docker network only) |
| Access | Docker socket (`/var/run/docker.sock`), shared volumes |
| Capabilities | Container logs, container restart, backup management, disk diagnostics |
| Auth | Token (defaults to `PM_SETTINGS_ENCRYPTION_KEY`) |
| Deploy config | `PM_OPS_AGENT_ENABLED` (default `true`) |

### 3.4 Private Docker Registry (ssh-registry mode)

| Property | Value |
|---|---|
| Image | `registry:2` (or `PM_DOCKER_SSH_REGISTRY_IMAGE`) |
| Bind | `127.0.0.1:5000` (server localhost only — never exposed) |
| Access | SSH tunnel from operator machine |
| Storage | `/home/<deploy-user>/app/registry` (host bind-mount) |
| Retention | `REGISTRY_STORAGE_DELETE_ENABLED: true` |
| Lifecycle | Created by Ansible, persists across deploys |

### 3.5 Ansible Roles

| Role | Purpose | Key Actions |
|---|---|---|
| `common` | Base system readiness | `apt update`, essential packages |
| `security` | Server hardening | UFW (deny incoming, allow 22/80/443), fail2ban (SSH: 5 failures → 1hr ban), unattended-upgrades (auto security patches), SSH lockdown (no root password, MaxStartups throttle, ClientAliveInterval 300, LogLevel VERBOSE) |
| `docker` | Container runtime | Docker Engine install, daemon config, user group |
| `monitoring` | System metrics | Netdata install (apt), bind to 127.0.0.1 + Docker bridge, never exposed publicly, UFW hole for app subnet to reach Netdata port |
| `deploy-user` | Operator access | Creates deploy user, sudoers entry, SSH key deployment |

### 3.6 Server Runtime Layout

```
/home/<deploy-user>/app/
├── shared/                        # App data (Docker bind-mounts)
│   ├── .env.runtime               # Container env file (deploy-generated)
│   ├── data/                      # SQLite database files
│   └── uploads/                   # User-uploaded media
├── releases/                      # Rollback state
│   ├── current-image              # Currently deployed image ref
│   ├── previous-image             # Previously deployed image ref
│   ├── current-version            # Current deploy version tag
│   ├── previous-version           # Previous deploy version tag
│   └── latest-db-backup           # Path of last maintenance backup
├── registry/                      # Private Docker registry storage
│                                   #  (ssh-registry mode only)
└── backups/                       # SQLite backup destination

/etc/traefik/dynamic/
└── puppetmaster2.yml              # Traefik routing config (deploy-generated)

/letsencrypt/
└── acme.json                      # TLS certificates (0600, Traefik-managed)
```

---

## 4. Security Model — Defense in Depth

### Layer 1: Transport
- HSTS `max-age=31536000; includeSubDomains; preload` (production only)
- HTTP → HTTPS redirect enforced by Traefik
- TLS via Let's Encrypt (auto-renewed by Traefik)

### Layer 2: HTTP Headers
- `X-Frame-Options: DENY` (clickjacking prevention)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: camera, microphone, geolocation, payment, USB, magnetometer, gyroscope, accelerometer all disabled
- `Cross-Origin-Opener-Policy: same-origin` (browsing context isolation)
- `Cross-Origin-Resource-Policy: same-origin`
- CSP with nonce injection (`server/plugins/csp-nonce.ts`)
- `Vary: Accept-Encoding` for cache correctness

### Layer 3: Application Security
- **CSRF protection** — `server/middleware/csrf.ts` middleware
- **Auth** — session-based with password hashing, 2FA (TOTP), role hierarchy (master > admin > editor > user)
- **Rate limiting** — `server/utils/rateLimit.ts`:
  - Login: 5 attempts / 15 min / IP
  - Contact form: 5 attempts / hour
  - 2FA setup: 10 attempts / hour / user
  - 2FA verify: 5 attempts / 15 min / IP
  - 2FA enable: 5 attempts / 15 min / user
  - 2FA disable: 3 attempts / 15 min / user
  - Storage: in-memory (default) or Redis (optional, for multi-instance)
- **Input validation** — Zod schemas on all API inputs
- **Secrets encryption** — AES-256-GCM for DB-stored settings:
  - Format: `enc:v1:{ivHex}:{authTagHex}:{cipherHex}`
  - Key: 64+ character hex, derived via `scryptSync` with salt
  - Production: fails fast if key is missing/placeholder/shell expression
- **Error sanitization** — never leaks stack traces to clients

### Layer 4: Sentry Error Monitoring
- `@sentry/node` server-side, `@sentry/vue` client-side
- Traces sample rate: 10% production, 100% development
- `beforeSend` filter strips: `authorization`, `cookie`, `x-csrf-token` headers; `password`, `passwordHash`, `secret`, `token`, `apiKey` from request bodies
- Ignores: ECONNRESET, EPIPE, 404s, ETIMEDOUT
- 4xx errors skipped (client errors), captures 5xx only

### Layer 5: Server Hardening
- **SSH**: root login prohibited (prohibit-password), password auth disabled at steady state (configurable), MaxStartups 10:30:60, ClientAliveInterval 300s, LogLevel VERBOSE
- **Firewall**: UFW default deny incoming, allow only 22, 80, 443
- **Brute force**: fail2ban (5 SSH failures in 10 min → 1 hour ban)
- **Auto-patching**: unattended-upgrades for security updates
- **Container**: app runs as non-root user `nuxt:1001`, no privileged mode

### Layer 6: Audit Trail
- `server/utils/audit.ts` — logs all security-sensitive actions (login, logout, role changes, settings changes, data mutations) to `audit_logs` table
- Stores: action, userId, targetUserId, ipAddress, userAgent, success flag, timestamp

---

## 5. Observability Stack

### 5.1 Health Endpoints

**Public** (`GET /api/health` — no auth):
```json
{
  "success": true,
  "data": {
    "status": "ok | degraded | unhealthy",
    "timestamp": "ISO-8601",
    "uptime": "seconds",
    "version": "app version",
    "buildVersion": "deploy version tag",
    "buildSha": "git sha",
    "buildTimestamp": "build time",
    "checks": [
      { "name": "database", "status": "ok", "latency": "ms" },
      { "name": "memory", "status": "ok", "message": "XXMB / YYMB" }
    ],
    "responseTime": "ms"
  }
}
```
Returns 503 when `unhealthy` (Docker health check catches this), 200 otherwise.

**Admin** (`GET /api/admin/health` — master role):
- All public fields plus: cgroup-aware RAM (container limits), Node.js heap details (used/allocated/limit/RSS/external), disk usage (df per mount: data, uploads, DB, app root), CPU (cgroup quota or 1-min loadavg), log buffer stats, build branch and commit message, Node.js version, environment
- Takes ~100ms sample for real CPU measurement in containers

### 5.2 Logging
- **Library**: Pino (structured JSON, fastest Node.js logger)
- **In-memory ring buffer**: 500 entries (~50KB), accessible via admin API
- **Docker logs**: `npm run deploy:logs` (tails app + Traefik containers), `docker logs puppetmaster2-app --tail 200`
- **Audit logs**: SQLite `audit_logs` table, queryable by user/action/date

### 5.3 System Metrics
- **Netdata**: installed by Ansible provisioning, served privately on `127.0.0.1:19999` + Docker bridge gateway
- **Not publicly exposed** — app containers access it via Docker bridge, PM admin renders it through internal API
- **UFW rule**: `ufw allow from <app-subnet> to <docker-gateway> port 19999`

### 5.4 External Uptime Monitoring (optional)
- **Uptime Kuma**: self-hosted, ~50MB RAM, deployed separately on the Docker network
- Configured URL: `https://{UPTIME_KUMA_SUBDOMAIN}.{SITE_DOMAIN}`
- Monitors: app health (`/api/health`), homepage, SSL cert expiry

---

## 6. Backup & Disaster Recovery

### 6.1 Database Backups
`scripts/backup-db.sh` supports:
- **Local backup**: `sqlite3 .backup` (WAL-safe), integrity check, gzip compression
- **Encryption**: AES-256-CBC with PBKDF2 (100k iterations), requires `BACKUP_ENCRYPTION_KEY`
- **S3 upload**: Supports any S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2, MinIO, DO Spaces)
- **Retention**: configurable local retention (default 7 days) and S3 retention (default 30 days)
- **Verification**: `--verify` flag decrypts, decompresses, runs `PRAGMA integrity_check`, counts tables

Scheduling via cron:
```
# Daily backup at 2 AM with S3 upload
0 2 * * * /app/scripts/backup-db.sh --remote >> /var/log/backup.log 2>&1

# Weekly full backup on Sunday
0 3 * * 0 /app/scripts/backup-db.sh --remote --weekly >> /var/log/backup.log 2>&1
```

### 6.2 Maintenance Schema Deploy Backup
When `PM_DEPLOY_SCHEMA_MODE=maintenance`, the Ansible playbook creates a backup before schema sync:
- Uses `sqlite3 .backup` on the existing DB
- Stores path in `release_state_dir/latest-db-backup`

### 6.3 Restore
`scripts/restore-db.sh` (counterpart to backup-db):
- Supports local and S3 restore sources
- Decrypts if encrypted
- Stops app container, replaces DB, verifies integrity, restarts container

### 6.4 Local Data Promotion
`npm run deploy:sync-local-data` copies the local project SQLite DB and uploads to production:
- Stops the production app container
- Transfers data over SSH to `/home/<deploy-user>/app/shared/`
- Fixes ownership for container UID/GID (1001:1001)
- Verifies SQLite integrity on the server side
- Restarts the container only after integrity check passes

### 6.5 Rollback
- **Image rollback** only — swaps app container to previous image ref
- **No database rollback** — schema changes are not reverted
- **Marker swap**: current ↔ previous image and version markers
- **Requirement**: at least two successful deploys must have been performed (previous-image marker must exist)
- Blocked with `PM_DEPLOY_SCHEMA_MODE=maintenance` unless `PM_DEPLOY_FORCE_APP_ROLLBACK=1`

---

## 7. Docker Development Mode

### 7.1 Architecture
`npm run dev` → `scripts/docker-dev.sh`:
- Builds Docker `development` stage (full source mount)
- Named volumes for `node_modules` and `.nuxt` (persisted across container restarts)
- Volume naming includes lockfile hash — different dependency sets get different volumes
- `.env` loaded and passed to container
- Auto port conflict resolution (finds next free port in range)
- Mounts: project root `/app`, named volumes for cache

### 7.2 Volume Strategy
- `{CONTAINER}-node-modules-{lockfile_hash}` — npm dependencies, not rebuilt unless lockfile changes
- `{CONTAINER}-nuxt` — Nuxt build cache (.nuxt directory)
- If local `node_modules/.bin/nuxt` exists, can seed the Docker volume from host without full rebuild

### 7.3 Key Rules
- **NEVER run `npm run build` during development** — uses Docker dev mode with hot-reload
- **NEVER clear `.nuxt`/`.output` caches** — Docker container owns them
- Build is only for production/deployment testing

---

## 8. CI Pipeline (GitHub Actions)

### 8.1 Job Graph

```
push/PR to master/main
│
├── [deploy-artifact-guard] ← always first (validates local-only artifacts)
│
├── [lint] ─────── eslint + nuxi typecheck
├── [test] ─────── vitest + coverage (Codecov + Coveralls)
├── [security] ─── npm audit (high+)
│
├── [playwright-smoke] ─── required, blocking (builds Docker dev image)
│
├── [build] ← needs [lint, test]
│   └── [lighthouse] ← PR only, needs [build]
│
├── [docker] ← needs [lint, test]
│
└── [visual-regression] ── PR only, non-blocking
```

### 8.2 Key Design Decisions
- CI validates code but **never deploys** — deployment is a manual operator action from a trusted machine
- `deploy-artifact-guard` prevents accidental exposure of generated secrets via `check-generated-deploy-artifacts.sh`
- Playwright smoke tests run against a Docker dev image (not a bare `npm run dev`)
- Lighthouse runs against a production build (not dev server) for accurate scores
- Visual regression diff screenshots uploaded as artifacts on failure
- CSS token validation has its own workflow, path-filtered to CSS changes only

### 8.3 CI Secrets
Only `CODECOV_TOKEN` and `LHCI_GITHUB_APP_TOKEN` are used in CI. No production deploy secrets, SSH keys, env files, or registry credentials exist in CI.

---

## 9. Configuration Contract

### 9.1 Environment Variables — Complete Reference

#### Operator-Deployed (in `.env`)
All values are in `.env.example` with documentation. Key categories:

| Category | Key Variables |
|---|---|
| Project mode | `PM_MODE`, `APP_VERSION` |
| Site identity | `SITE_DOMAIN`, `SITE_DOMAIN_ALIASES` |
| Server access | `SERVER_IP`, `SERVER_ROOT_PASSWORD`, `SSH_KEY`, `DEPLOY_USER`, `DEPLOY_USER_PASSWORD`, `DEPLOY_SSH_KEY`, `PM_DEPLOY_AUTH_MODE` |
| TLS | `ACME_EMAIL` |
| Docker transport | `PM_DOCKER_DEPLOY_MODE`, `PM_DOCKER_REGISTRY`, `PM_DOCKER_IMAGE`, `PM_DOCKER_USERNAME`, `PM_DOCKER_TOKEN`, `PM_DOCKER_SSH_REGISTRY_HOST`, `PM_DOCKER_SSH_REGISTRY_PORT`, `PM_DOCKER_STREAM_COMPRESSION` |
| Database | `DATABASE_URL`, `PM_DEPLOY_DATABASE_URL` |
| Encryption | `PM_SETTINGS_ENCRYPTION_KEY` (REQUIRED in production) |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| S3 storage | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`, `S3_VISIBILITY`, `S3_PUBLIC_URL`, `S3_PROXY_SIGNING_KEY` |
| External API | `API_BASE_URL`, `API_CLIENT_ID`, `API_CLIENT_SECRET`, `API_TOKEN_URL`, `API_JWT_TOKEN`, `API_KEY` |
| Redis cache | `REDIS_URL`, `REDIS_PREFIX` |
| Monitoring | `PM_MONITORING_NETDATA_ENABLED`, `NETDATA_URL`, `PM_OPS_AGENT_ENABLED`, `PM_OPS_AGENT_TOKEN`, `UPTIME_KUMA_SUBDOMAIN` |
| Admin bootstrap | `PM_ADMIN_PASSWORD_ROTATION_ENABLED`, `PM_ADMIN_MASTER_EMAIL`, `PM_ADMIN_MASTER_PASSWORD`, etc. |
| Schema policy | `PM_DEPLOY_SCHEMA_MODE`, `PM_DEPLOY_MAINTENANCE_ACK` |
| Health retries | `PM_DEPLOY_HEALTH_RETRIES`, `PM_DEPLOY_HEALTH_INITIAL_DELAY_SECONDS`, `PM_DEPLOY_HEALTH_BACKOFF_SECONDS` |
| Container naming | `PM_APP_CONTAINER_NAME`, `PM_APP_NETWORK`, `TRAEFIK_IMAGE` |

#### Auto-Generated (by setup/deploy, never edited manually)
- `ansible/inventory.yml` — host IP, auth mode, SSH key path, known hosts
- `ansible/deploy-vars.yml` — all runtime env vars rendered for Ansible consumption
- `/home/<deploy-user>/app/shared/.env.runtime` — app container env file (on server)
- `/etc/traefik/dynamic/puppetmaster2.yml` — Traefik routing (on server)
- Release markers: `current-image`, `previous-image`, etc. (on server)

#### Validated at Startup (`server/plugins/01.env-validation.ts`)
- `NODE_ENV` must be `development | production | test`
- `PM_SETTINGS_ENCRYPTION_KEY` required in production, validated format (64+ hex characters, no placeholders, no shell expressions)
- `DATABASE_URL` defaults to `./data/sqlite.db`
- SMTP, S3, API credentials optional but validated for format if present via Zod

### 9.2 Generated Files (Local-Only, Git-Ignored)

| File | Contains | Git Status |
|---|---|---|
| `ansible/inventory.yml` | Server IP, auth mode, SSH key path, known hosts | `.gitignore` |
| `ansible/deploy-vars.yml` | ALL live secrets, deploy settings | `.gitignore` |
| `ansible/known_hosts` | SSH host key fingerprints | `.gitignore` |
| `.pm-deploy-state.json` | Setup progress: stage name, status, failure reason | `.gitignore` |
| `.env` | All secrets and configuration | `.gitignore` |

If any generated deploy artifact is exposed, rotate: `DEPLOY_USER_PASSWORD`, `PM_SETTINGS_ENCRYPTION_KEY`, `PM_DOCKER_TOKEN`, SMTP, S3, and API credentials.

---

## 10. Operational Command Reference

| Command | Purpose |
|---|---|
| `npm run dev` | Start Docker-based dev server (hot-reload, port 3000 auto-fallback) |
| `npm run dev:host` | Start Nuxt directly (bare metal, not Docker) |
| `npm run build` | Production build (deployment/Lighthouse use only) |
| `npm run preview` | Preview production build locally |
| `npm run deploy:secrets` | Generate/fill Docker-first deploy secrets in `.env` |
| `npm run setup` | First-time server bootstrap + provisioning + deploy |
| `npm run setup:resume` | Resume failed setup from last checkpoint |
| `npm run deploy` | Build image → transfer → schema sync → replace container → health check |
| `npm run rollback` | Swap to previous app image (no DB rollback) |
| `npm run setup` | First-time server bootstrap + Dockge/Traefik provisioning + deploy |
| `npm run deploy` | Build image → transfer → Docker Compose deploy → health check |
| `npm run deploy:logs` | Tail app + Traefik container logs on server |
| `npm run deploy:shell` | Interactive SSH shell to server |
| `npm run deploy:sync-local-data` | Promote local DB/uploads to production |
| `npm run db:push` | Push Drizzle schema to local SQLite (dev only) |
| `npm run db:seed` | Seed local database with sample data |
| `npm run db:reset` | Reset local database (delete + push + seed) |
| `npm run db:migrate:prod` | Run reviewed SQL migrations (production path) |
| `npm run db:studio` | Open Drizzle Studio (GUI database browser) |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run lint:css-tokens` | Validate CSS variable system |
| `npm run test:run` | Full test suite (unit + API) |
| `npm run test:e2e:playwright` | Playwright E2E tests |
| `npm run admin:passwords:rotate` | Generate new admin passwords |
| `npm run check:versions` | Audit framework version consistency |
| `npm run generate:favicons` | Generate favicon set from SVG |
| `npm run internal:server:provision` | Run Ansible provisioning directly |
| `npm run docker:build` | Build production Docker image manually |
| `npm run docker:dev:clean` | Remove orphaned Docker dev volumes |
| `npm run audit:api-envelope` | Audit API response format consistency |

### Database Scripts (dev only)
| Command | Purpose |
|---|---|
| `npm run db:push` | Push schema changes (force, local dev) |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run Drizzle migrations locally |
| `npm run db:seed` | Seed local database |
| `npm run db:reset` | Full local DB reset |
| `npm run db:studio` | Open Drizzle Studio GUI |

### Deploy Health Check Tuning

```env
PM_DEPLOY_HEALTH_RETRIES=8                    # Max attempts
PM_DEPLOY_HEALTH_INITIAL_DELAY_SECONDS=3     # Wait before first attempt
PM_DEPLOY_HEALTH_BACKOFF_SECONDS=3           # Seconds between retries
PM_DEPLOY_HEALTH_CONNECT_TIMEOUT_SECONDS=5   # curl --connect-timeout
PM_DEPLOY_HEALTH_MAX_TIME_SECONDS=15         # curl --max-time
```

### Ansible Retry Tuning
```env
PM_DEPLOY_ANSIBLE_RETRIES=3                  # Max Ansible rollout attempts
PM_DEPLOY_ANSIBLE_RETRY_DELAY_SECONDS=5      # Delay between retries
```

---

## 11. Design Principles & Decisions

| Principle | Implementation |
|---|---|
| **Single source of truth** | `.env` drives everything — Ansible artifacts, deploy scripts, runtime config |
| **Zero-dependency deploy** | Default `ssh-registry` mode needs no Docker Hub, GHCR, or any third-party service |
| **Defense in depth** | 6 security layers: transport → headers → app → Sentry → server → audit |
| **Fail fast** | Startup validates all critical config, exits code 1 in production on any failure |
| **Idempotent** | Setup and deploy are safe to rerun; state tracking enables resume |
| **Traceable** | Every image carries immutable build metadata: SHA, branch, timestamp, commit message |
| **Graceful degradation** | Rate limiting falls back to in-memory when Redis unavailable; Sentry skips silently when DSN absent; Netdata shown as unavailable when not installed |
| **Container-first** | Everything runs in Docker: dev, CI, production. No bare-metal Node.js in production. |
| **Non-root container** | App runs as `nuxt:1001`, shared data owned by same UID/GID |
| **Manual deploy gate** | CI never deploys. Deployment is a deliberate human action from a trusted machine. |
| **Layered cache** | Docker: build cache + layer cache. Dev: lockfile-hashed volume. SSH-registry: layer-cached pushes. |
| **Configurable but opinionated** | Defaults are secure and practical; everything is overridable via env vars. |
