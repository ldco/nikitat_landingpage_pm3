# Plan: Simplify Deploy System

## Problem
1.6.0 introduced a target-registry system (`~/.pm/`, 7 new scripts, 5 new npm commands)
that overcomplicated deployment. `npm run deploy` now requires `--target` or fails.
The "legacy" vs "targeted" split is confusing.

## Goal
One system: `.env` is the single source of truth.
- `npm run setup` — provision VPS with Dockge, Traefik, Docker (one time)
- `npm run deploy` — build, push, deploy via Docker Compose per project (any time)
Works for 1 project or N projects on the same VPS. No target registry, no dual system.

## Tasks

### 1. Delete target-registry files (9 files)
- scripts/lib/pm-targets.sh
- scripts/pm-server-create.sh, pm-target-list.sh, pm-project-migrate.sh
- scripts/pm-deploy-project.sh, pm-migrate-to-shared.sh, scripts/pm
- docs/releases/1.6.0.md, docs/operations/multi-project-deploy.md

### 2. Fix pm-traefik-config.sh — env-based SSH, no target registry
Replace source of pm-targets.sh with direct env var reads (SERVER_IP, DEPLOY_USER,
DEPLOY_SSH_KEY, DEPLOY_USER_PASSWORD, PM_DEPLOY_AUTH_MODE).

### 3. Fix deploy.sh — remove --target, Docker Compose deploy
- Remove lines 19-65 (target vars + --target parsing)
- Remove lines 605-652 (messy shared VPS block, replace with clean block)
- Derive PROJECT_ID from SITE_DOMAIN, run ansible/deploy.yml, call pm-traefik-config.sh

### 4. Fix ansible/deploy.yml — remove broken Traefik section
Lines 262-306 hardcode empty router/service arrays, wiping other projects' config.
Remove — pm-traefik-config.sh handles it properly.

### 5. Clean package.json — remove 5 scripts, fix deploy scripts list
Remove: server:create, target:list, project:migrate, deploy:project, migrate-to-shared

### 6. Update CHANGELOG.md 1.6.0 entry

### 7. Update docs/operations/devops-system.md command reference
