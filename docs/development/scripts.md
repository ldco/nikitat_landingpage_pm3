# Scripts Reference

Complete reference for all Puppet Master scripts and commands.

---

## NPM Scripts

These scripts are available via `npm run <script>`:

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server in the shared Docker runtime |
| `npm run dev:host` | Start Nuxt directly on the host; internal escape hatch for Docker/dev diagnostics |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run generate` | Generate static site |
| `npm run postinstall` | Post-install setup (auto-runs) |

### Code Quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run lint:css-tokens` | Lint CSS token usage |
| `npm run lint:css-tokens:enforce` | Lint CSS tokens (fail on errors) |

### Testing

| Command | Description |
|---------|-------------|
| `npm run test` | Run staged tests (unit + API) |
| `npm run test:run` | Run all tests with Vitest |
| `npm run test:unit` | Run unit tests only |
| `npm run test:api` | Run API tests only |
| `npm run test:api:single` | Run API tests (single worker) |
| `npm run test:e2e` | Run e2e tests |
| `npm run test:e2e:playwright` | Run Playwright visual tests |
| `npm run test:e2e:playwright:ui` | Run Playwright with UI |

### Database

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (delete + migrate + seed) |

### Assets

| Command | Description |
|---------|-------------|
| `npm run assets:optimize` | Optimize images (AVIF/WebP/PNG) |
| `npm run assets:optimize:full` | Full optimization (includes PNG) |
| `npm run generate:favicons` | Generate favicons from SVG |
| `npm run assets:launch` | Generate root launch assets such as `public/og-image.png` from designer source files |
| `npm run check:launch-assets` | Warn about missing/invalid launch assets such as `og-image`, favicons, app icons, robots, and sitemap |
| `npm run check:launch-assets:enforce` | Enforce launch asset checks (fail on warnings) |

### Workflow (AI)

| Command | Description |
|---------|-------------|
| `npm run workflow:switch <name>` | Switch AI workflow (claude/qwen/codex) |
| `npm run workflow:info` | Show current workflow status |

### Deployment

| Command | Description |
|---------|-------------|
| `npm run deploy:secrets` | Generate/fill local Docker-first deploy secrets |
| `npm run setup` | Blank-server bootstrap + first deploy |
| `npm run deploy` | Normal deploy; regenerates Ansible deploy artifacts from `.env` first |
| `npm run rollback` | Roll back to the previously recorded app image |
| `npm run deploy:logs` | View deployment logs |
| `npm run deploy:shell` | SSH into deployment |
| `npm run deploy:sync-local-data` | Promote local DB/uploads into production volumes |
| `npm run docker:build` | Build Docker image |
| `npm run docker:dev` | Start the Docker-based development server |
| `npm run docker:dev:clean` | Remove old Docker dev dependency volumes |
| `npm run docker:run` | Run Docker container |

### Deployment Internals

These exist as implementation plumbing for the public workflow and are not the default operator entrypoints:

| Command | Description |
|---------|-------------|
| `npm run internal:server:provision` | Raw Ansible provisioning helper for manual diagnostics |
| `npm run internal:server:provision:check` | Ansible dry-run helper for manual diagnostics |

### Audit & Validation

| Command | Description |
|---------|-------------|
| `npm run audit:api-envelope` | Audit API response envelopes |
| `npm run audit:api-envelope:enforce` | Audit API envelopes (fail on errors) |
| `npm run check-doc-entrypoints` | Check documented scripts exist |
| `npm run check-doc-entrypoints:enforce` | Check scripts (fail on mismatch) |
| `npm run assets:launch` | Generate root launch assets before validation/build |
| `npm run check:launch-assets` | Warn about missing/invalid social preview, favicon, app icon, robots, and sitemap assets |
| `npm run check:launch-assets:enforce` | Enforce launch asset checks (fail on warnings) |
| `npm run check:versions` | Check framework dependency/runtime version contract |

### Initialization

| Command | Description |
|---------|-------------|
| `npm run init` | Initialize project (opens wizard) |
| `npm run init -- --headless` | Headless initialization |

---

## Docker Development

`npm run dev` runs Nuxt inside the repository Dockerfile's `development` target. It mounts the workspace into `/app`, keeps container-owned `node_modules` and `.nuxt` in Docker volumes, and uses `.env` when present.

The Docker dev runner parses `.env` itself before passing values into the container, so quoted dotenv values such as `SMTP_FROM="Site Name <mail@example.com>"` behave like they do in normal shell-based dotenv loading.

Dependency volume names include a fingerprint of `package-lock.json`, so dependency updates automatically use a fresh `/app/node_modules` volume. Old dependency volumes are safe to remove with:

```bash
npm run docker:dev:clean
```

Environment precedence for container runtime values:

1. Shell variables passed to `npm run dev`, for example `DATABASE_URL=./data/test.db npm run dev`.
2. Values in `PM_DOCKER_DEV_ENV_FILE`, or `.env` by default.
3. Script defaults: `DATABASE_URL=./data/sqlite.db` and `UPLOAD_DIR=/app/uploads`.

Useful overrides:

| Variable | Description |
|----------|-------------|
| `PM_DOCKER_DEV_HOST_PORT=3003` | Bind the container dev server to a specific host port; by default the script auto-selects the next free port when `3000` is busy |
| `PM_DOCKER_DEV_ENV_FILE=/path/to/.env` | Use a different env file for local Docker dev |
| `PM_DOCKER_DEV_BUILD=always` | Force a Docker dev image rebuild |
| `PM_DOCKER_DEV_SKIP_BUILD=true` | Skip the image build when the cached dev image is already current |

Use `npm run dev:host` only when intentionally bypassing Docker for diagnostics.

---

## Shell Scripts

Located in `scripts/`:

### Database Maintenance

| Script | Description | Usage |
|--------|-------------|-------|
| `backup-db.sh` | Backup SQLite database | `./scripts/backup-db.sh [--remote] [--verify]` |
| `restore-db.sh` | Restore from backup | `./scripts/restore-db.sh [--latest \| <file>]` |

**Environment Variables:**
- `DATABASE_URL` — Database path (default: `/app/data/sqlite.db`)
- `BACKUP_DIR` — Backup directory (default: `/app/data/backups`)
- `RETENTION_DAYS` — Local retention (default: 7)
- `BACKUP_ENCRYPTION_KEY` — Encryption key (optional)

---

## Node/TypeScript Scripts

Located in `scripts/`:

### Core Scripts

| Script | NPM Command | Description |
|--------|-------------|-------------|
| `init-cli.ts` | `npm run init` | Project initialization wizard |
| `switch-workflow.ts` | `npm run workflow:switch` | Switch AI workflow |
| `workflow-info.ts` | `npm run workflow:info` | Show workflow status |

### Audit Scripts

| Script | NPM Command | Description |
|--------|-------------|-------------|
| `audit-api-envelope.mjs` | `npm run audit:api-envelope` | Validate API response envelopes |
| `check-doc-entrypoints.mjs` | `npm run check-doc-entrypoints` | Verify documented scripts exist |
| `lint-css-tokens.js` | `npm run lint:css-tokens` | Lint CSS token usage |

### Asset Scripts

| Script | NPM Command | Description |
|--------|-------------|-------------|
| `optimize-assets.mjs` | `npm run assets:optimize` | Image optimization pipeline |
| `generate-launch-assets.mjs` | `npm run assets:launch` | Root launch asset generation pipeline |
| `check-launch-assets.mjs` | `npm run check:launch-assets` | Launch asset warning/enforcement check |

### Maintenance Scripts

| Script | Description |
|--------|-------------|
| `maintenance/migrate-portfolio.ts` | One-time portfolio schema migration |

---

## Script Libraries

Located in `scripts/lib/`:

| Module | Description |
|--------|-------------|
| `config-reader.ts` | Read puppet-master.config.ts |
| `config-writer.ts` | Write configuration changes |
| `index.ts` | Library exports |
| `modules.ts` | Module utilities |

---

## Usage Examples

### Initialize New Project

```bash
npm run init
```

### Optimize Images

```bash
# Automatic (runs on build)
npm run build

# Manual
npm run assets:optimize
```

### Audit API Envelopes

```bash
# Check only
npm run audit:api-envelope

# Fail on errors (CI)
npm run audit:api-envelope:enforce
```

### Backup Database

```bash
# Local backup
./scripts/backup-db.sh

# With S3 upload
./scripts/backup-db.sh --remote

# Verify integrity
./scripts/backup-db.sh --verify
```

### Switch AI Workflow

```bash
# Switch to Qwen
npm run workflow:switch -- qwen

# Check current
npm run workflow:info
```

---

## Related Documentation

- [Getting Started](../guides/getting-started.md) — Setup guide
- [AI Workflows](../architecture/ai-workflows.md) — Workflow selection
- [Configuration](../reference/configuration.md) — Full configuration reference
