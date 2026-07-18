# Changelog

## 1.6.0 — 2026-06-10

### Unified Shared-VPS Deployment System
- **Single system**: Dockge-based deploy on any VPS. Works for 1 project or N projects. No dual-system complexity, no target registry.
- **`.env` is the only source of truth**: `SERVER_IP`, `SITE_DOMAIN`, etc. No separate `~/.pm/` registry needed.
- **Per-project Docker Compose**: Each project gets its own `docker-compose.yml` in `/home/deploy/app/stacks/<project-id>/` with isolated data (SQLite, uploads).
- **Composite Traefik routing**: One shared Traefik routes all project domains. Config auto-regenerated on every deploy.
- **Dockge dashboard**: Web UI at `https://<vps-ip>:5001` for managing all project stacks.

### Commands
- `npm run setup` — provisions VPS (Docker, Dockge, Traefik, shared network) — one time
- `npm run deploy` — builds Docker image, pushes to VPS, deploys via Docker Compose — any time
- `npm run rollback` — swaps to previous Docker image
- `npm run deploy:logs` — tail containers on server
- `npm run deploy:shell` — SSH shell to server

### New Files
- `ansible/provision-shared.yml` — VPS provisioning playbook (Dockge, Traefik, Docker, shared network)
- `ansible/deploy.yml` — per-project deploy playbook (Docker Compose, migrations, env)
- `scripts/pm-traefik-config.sh` — composite Traefik config generator

### Ansible
- Removed legacy `playbook.yml` and `deploy-app.yml` (old single-project non-Dockge system)
- `scripts/setup.sh` references `provision-shared.yml` for VPS setup
- `scripts/deploy.sh` references `deploy.yml` for per-project Docker Compose deploy

### Other Changes
- Color rebrand: deep maroon tones → sweet dark blue/light gray/pink-red/cyan palette
- Hero section: fixed logo sizing, removed opacity:0 hack
- AGENTS.md: replaced inline canonical knowledge with pm-framework skill reference
- Ansible: `ansible_distribution_release` → `ansible_facts["distribution_release"]` for modern compat

## 1.5.0 — 2026-06-10

### TypeScript Bulletproof System
- **Layer 1 — Compiler Lockdown**: All 5 tsconfigs enforce `strict: true`, `noUncheckedIndexedAccess: true`, `isolatedModules: true`, `verbatimModuleSyntax: true`
- **Layer 2 — Zod Runtime Validation**: 39 server files validate untrusted data at every API boundary
- **Layer 3 — Escape Hatch Ban**: ESLint enforces `no-explicit-any: error`, `ban-ts-comment: error`, `no-non-null-assertion: error` across `.ts` and `.vue` files
- **Layer 4 — Discriminated Unions**: Added `DiscriminatedPortfolioItem` type with `itemType` discriminator (`image`/`video`/`link` | `case_study`)
- **Layer 5 — Never Exhaustiveness**: 3 switch statements hardened with `const _exhaustive: never` compile-time guards

### Code Cleanup
- Eliminated all 38 `any` types — `catch (e: any)` → `catch (e: unknown)`, `as any` → typed interfaces
- Fixed all 38 non-null assertions with proper null guards across 20 files
- Fixed ESLint ignores to cover all `.nuxt*` directories (`.nuxt-root`, `.nuxt-old`)

### Documentation
- Added TypeScript Rules section to AGENTS.md (7 rules: zero any, unknown catch, no as any, typed wrappers, no escape hatches, discriminated unions, never exhaustiveness)
- Created `contributing/ts_bulletproof.md` — full 5-layer reference guide

### Verification
- 0 lint errors, 0 `any` types, 0 `!` assertions, 0 `@ts-ignore` across entire codebase
- TypeScript compilation passes cleanly (`vue-tsc --noEmit`)
