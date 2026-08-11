# Puppet Master v3 (PM3) Deployment Guide

## Overview

Production uses one deployment contract:

- build a versioned Docker image from this repository
- by default push changed image layers from the dev PC through SSH to a private registry on the server
- orchestrate the host with Ansible and `community.docker`
- run the app as a Docker container on a private Docker network
- run Traefik in Docker for HTTPS and routing

This is the canonical framework-level operator flow for Puppet Master v3 (SvelteKit). The app runtime is not a host `systemd` service. No third-party registry is required for the default `ssh-registry` mode.

## Release Model

Production releases are manual operator actions from a trusted workstation or admin PC. A push to `master`, `main`, or any other branch does not deploy production. CI workflows may validate code, but they do not receive production deploy secrets, do not generate deploy `.env` files, and do not run `scripts/deploy.sh`.

The production release command is:

```bash
npm run deploy
```

Run it from the machine that owns the target server `.env`, SSH trust, and local-only Ansible artifacts.

## Prerequisites

### Local machine

- Node.js 22+
- `ansible-playbook`
- `ansible-galaxy`
- `curl`
- `docker`
- `git`
- `openssl`
- `ssh`
- `ssh-keyscan`
- `sshpass` when `SSH_KEY=false`
- `zstd` only when using the emergency `local` stream mode

Example:

```bash
sudo apt-get update
sudo apt-get install -y ansible sshpass openssh-client openssl curl git zstd
```

The playbooks declare Docker automation in `ansible/requirements.yml`.
The public `npm run setup`, `npm run deploy`, and `npm run rollback` scripts install those collections automatically before running Ansible. For manual playbook runs:

```bash
ansible-galaxy collection install -r ansible/requirements.yml
```

### Server

- Ubuntu 22.04 LTS recommended
- Docker Engine installed by provisioning
- DNS already points `SITE_DOMAIN` to `SERVER_IP`
- every `SITE_DOMAIN_ALIASES` hostname also points to `SERVER_IP`
- provider root password available for the first bootstrap when password setup is used

## Required `.env` contract

The env model has three distinct contracts (PM2-style narrow runtime surface + automated bootstrap/validation lifecycle), not one mixed workspace:

1. **Runtime app config** — the narrow surface the app reads via `process.env` and validates in `src/lib/server/utils/env.ts` (`NODE_ENV`, `PORT`, `DATABASE_URL`, `LOG_LEVEL`, `TOTP_ENCRYPTION_KEY`, `PM_TRUST_PROXY`, `SMTP_*`, `CLAMAV_*`, `SENTRY_*`, `PM_FEATURES_HIBP`). There are no soft dev fallbacks — a missing required value fails clearly and early.
2. **Long-lived deploy secrets** — generated **only during first-time bootstrap** (`ensure_framework_env` in `scripts/lib/deploy-env.sh`): `DEPLOY_USER_PASSWORD`, `PM_SETTINGS_ENCRYPTION_KEY`, `PM_ADMIN_MASTER_PASSWORD`, `PM_ADMIN_ADMIN_PASSWORD`, `PM_ADMIN_USER_PASSWORD`. Never read by the app; used only by setup/deploy/rotation.
3. **First-run operator inputs** — site facts + deploy transport: `SERVER_IP`, `SITE_DOMAIN`, `ACME_EMAIL` (+ `SERVER_ROOT_PASSWORD` for the first-time password bootstrap), `SSH_KEY`, `DEPLOY_USER`, Docker/registry settings, Traefik image, admin rotation flag.

### Lifecycle: bootstrap vs steady-state

- **First-time bootstrap** (no setup state file yet, or explicit `PM_ENV_INIT=1`): `npm run setup`, `npm run deploy`, `npm run dev` and `npm run db:seed`/`db:reset` may create `.env` from `.env.example` and auto-generate the long-lived secrets. `npm run setup` prompts for the site facts on a TTY; the preflight otherwise fails fast listing the missing ones.
- **Steady state** (setup state exists): `npm run setup` and `npm run deploy` validate the initialized `.env` — `.env` must exist and the stable keys above must be real values. They **fail instead of regenerating**: silently regenerating long-lived secrets would orphan encrypted settings and 2FA secrets on the deployed server. Restore `.env` from a backup, or re-initialize intentionally with `PM_ENV_INIT=1`.

`npm run deploy:secrets` remains available as an explicit helper for the same contract:

```bash
npm run deploy:secrets
```

If you intentionally choose registry mode, pass the registry token through the environment when you want the script to store it:

```bash
PM_DOCKER_TOKEN=your_registry_token npm run deploy:secrets
```

Reference of the deploy contract (contracts 2 + 3; all but the site facts are framework-generated/defaulted):

```env
APP_VERSION=0.1.0
SERVER_IP=123.45.67.89
SITE_DOMAIN=example.com
SITE_DOMAIN_ALIASES=www.example.com
ACME_EMAIL=admin@example.com
DEPLOY_USER=deploy
SSH_KEY=false
SERVER_ROOT_PASSWORD=provider-root-password
DEPLOY_USER_PASSWORD=deploy-user-password
DATABASE_URL=./data/sqlite.db
PM_DEPLOY_DATABASE_URL=/app/data/sqlite.db
PM_SETTINGS_ENCRYPTION_KEY=<literal-64-char-hex-secret>
PM_DOCKER_DEPLOY_MODE=ssh-registry
PM_DOCKER_REGISTRY=
PM_DOCKER_IMAGE=puppetmaster2-app
PM_DOCKER_USERNAME=
PM_DOCKER_TOKEN=
PM_DOCKER_SSH_REGISTRY_HOST=127.0.0.1
PM_DOCKER_SSH_REGISTRY_PORT=5000
PM_DOCKER_STREAM_COMPRESSION=zstd
PM_APP_CONTAINER_NAME=puppetmaster2-app
PM_APP_NETWORK=puppetmaster2
PM_ADMIN_PASSWORD_ROTATION_ENABLED=true
PM_ADMIN_MASTER_EMAIL=master@example.com
PM_ADMIN_MASTER_PASSWORD=<strong-random-password>
PM_ADMIN_ADMIN_EMAIL=admin@example.com
PM_ADMIN_ADMIN_PASSWORD=<strong-random-password>
PM_ADMIN_USER_EMAIL=editor@example.com
PM_ADMIN_USER_PASSWORD=<strong-random-password>
```

`APP_VERSION` is the stable product/app version shown in admin and health responses.
The build version is generated automatically from the exact deploy build timestamp and git commit.
`PM_DOCKER_IMAGE_TAG` may override the generated Docker tag when needed. `PM_DOCKER_USERNAME` and `PM_DOCKER_TOKEN` are only required for `PM_DOCKER_DEPLOY_MODE=registry`.
`PM_DOCKER_DEPLOY_MODE=ssh-registry` starts a private `registry:2` container on server loopback, opens an SSH tunnel from the operator PC, and uses Docker push/pull so unchanged layers are reused. No Docker Hub, GHCR, GitHub, or GitLab deploy service is required.
If the server does not already have the private registry image, setup/deploy loads `PM_DOCKER_SSH_REGISTRY_IMAGE` from the operator PC over SSH before starting the registry. The default is `registry:2`.
`PM_DOCKER_STREAM_COMPRESSION` controls only `PM_DOCKER_DEPLOY_MODE=local`, the emergency full-image stream fallback.

Encryption keys are auto-generated on first run and must stay stable between deploys: keep the old `PM_SETTINGS_ENCRYPTION_KEY` / `TOTP_ENCRYPTION_KEY` values (restore them from a backup) when reinstalling, otherwise encrypted settings and 2FA secrets become unreadable. Do not place command substitutions in `.env`.

Optional PM-native resource monitoring:

```env
PM_MONITORING_NETDATA_ENABLED=true
NETDATA_URL=http://127.0.0.1:19999
```

When enabled, provisioning attempts to install Netdata and bind it to localhost. The app uses Netdata only as a private metrics source; the admin health page renders CPU, RAM, disk, load, network, and disk I/O with Puppet Master UI components.

Important behavior:

- `SSH_KEY=true` keeps SSH-key deploy access as the steady-state path.
- `SSH_KEY=false` keeps password-based deploy access.
- `SERVER_SSH_HOST_KEY_FINGERPRINT` is optional. If blank, the scripts trust the first `ssh-keyscan` result and pin it into `ansible/known_hosts`.

### Admin bootstrap & password rotation (mandatory)

`PM_ADMIN_PASSWORD_ROTATION_ENABLED`, `PM_ADMIN_MASTER_PASSWORD`, `PM_ADMIN_ADMIN_PASSWORD`, and `PM_ADMIN_USER_PASSWORD` are required production bootstrap and rotation inputs for the built-in privileged accounts (master/admin/editor).

- Rotation is mandatory, not opt-in: the deploy preflight (`scripts/deploy.sh` → `validate_admin_rotation_contract` in `scripts/lib/deploy-env.sh`) and the Ansible playbook (`ansible/deploy.yml`) both fail the rollout unless `PM_ADMIN_PASSWORD_ROTATION_ENABLED=true` and **all three** password variables are set. Any of the three being unset or weak aborts the deploy before the container is replaced.
- Every deploy runs the rotation container (`node scripts/rotate-admin-passwords.mjs --apply`); when a configured password differs from the stored hash it re-hashes it, flags the account for a forced password change on next login, and revokes its sessions. Unchanged credentials are skipped — rotation is idempotent and only acts on an actual credential change.
- The bootstrap credentials are **not persisted in the long-lived runtime app environment**: they are injected only into the one-off rotation container via its `env` overrides and never written to `/home/<deploy-user>/app/shared/.env.runtime`. The running app container therefore has no `PM_ADMIN_*_PASSWORD` values — they exist only in the operator's local `.env` (and `ansible/deploy-vars.yml`) and must be treated as deploy-time secrets.
- Strong random values are auto-generated on first run (`ensure_framework_env`). To use explicit values instead (e.g. from a password manager), set them in `.env` — the framework keeps them and only generates what is missing. To regenerate on demand:

```bash
node scripts/rotate-admin-passwords.mjs --generate --write-env
```

## First-Time Setup

Run:

```bash
npm run setup
```

Setup writes local, ignored progress state to `.pm-deploy-state.json`.
If setup fails after touching production, rerun:

```bash
npm run setup:resume
```

Until setup reaches the completed state, `npm run deploy` refuses to run and prints the last recorded setup stage, failure reason, and required `.env` keys. The state file records only stage labels, booleans, and non-secret reason text; it does not store passwords, SSH keys, tokens, hashes, or rendered Ansible secrets.

Setup does the following:

1. validates `.env`
2. validates deploy auth mode, deploy user, TLS email, DB path, and Docker image contract
3. records the target SSH host key in the managed known-hosts file
4. bootstraps or repairs deploy access
5. generates local-only Ansible artifacts:
   - `ansible/inventory.yml`
   - `ansible/deploy-vars.yml`
6. provisions the server with Ansible
7. builds the versioned app Docker image, then either pushes changed layers through the SSH tunnel, streams a full archive in `local` fallback mode, or pushes to an external registry
8. writes `/home/<deploy-user>/app/shared/.env.runtime`
9. configures Traefik dynamic routing for `SITE_DOMAIN` and aliases
10. creates the app Docker network and shared DB/uploads paths
11. if `/home/<deploy-user>/app/shared/...` is empty, auto-promotes local SQLite DB/uploads by reusing `deploy:sync-local-data`
12. runs reviewed SQL migrations inside a one-off app container
13. starts/recreates the app container
14. starts/recreates Traefik on the same Docker network
15. records current/previous image and version markers
16. retries `https://$SITE_DOMAIN/api/health`

## Normal Deploy

Run:

```bash
npm run deploy
```

Deploy repeats image build/transfer, schema sync, container replacement, marker update, and post-deploy health verification.

For default `ssh-registry` mode, image transfer is self-contained over SSH. The private registry listens only on server loopback, and the operator PC reaches it through a temporary SSH tunnel. Docker push sends only missing layers, which avoids repeated full-image transfers after the first deploy.

For `local` fallback mode, the script streams the whole image over SSH. No external registry is used, but this mode is intentionally slower for normal releases. The framework-required transfer codec is `zstd`; the deploy script logs the selected compression codec.

`npm run setup` installs `zstd` through Ansible. `npm run deploy` also runs a lightweight pre-stream repair that installs `zstd` on existing servers before `docker save` starts. If the operator PC is missing `zstd`, deploy fails immediately with the install command.

Install the local deploy dependency on the operator PC:

```bash
sudo apt-get update
sudo apt-get install -y zstd
```

Deploy preflight blocks the rollout if:

- required Docker registry/image settings are missing
- `PM_DEPLOY_DATABASE_URL` does not point inside `/app/data`
- the encryption key is absent or invalid
- admin bootstrap rotation is disabled or any of `PM_ADMIN_MASTER_PASSWORD` / `PM_ADMIN_ADMIN_PASSWORD` / `PM_ADMIN_USER_PASSWORD` is unset
- schema rollout mode is invalid

## Health-Check Retries

Setup, deploy, and rollback use bounded retries instead of a single final curl.

Config:

```env
PM_DEPLOY_HEALTH_RETRIES=8
PM_DEPLOY_HEALTH_INITIAL_DELAY_SECONDS=3
PM_DEPLOY_HEALTH_BACKOFF_SECONDS=3
PM_DEPLOY_HEALTH_CONNECT_TIMEOUT_SECONDS=5
PM_DEPLOY_HEALTH_MAX_TIME_SECONDS=15
```

When the final check still fails, the scripts print direct diagnostics:

```bash
npm run deploy:logs
ssh deploy@SERVER_IP docker ps --filter name=puppetmaster2
ssh deploy@SERVER_IP docker logs puppetmaster2-app --tail 200
ssh deploy@SERVER_IP docker logs puppetmaster2-traefik --tail 200
curl -vk https://SITE_DOMAIN/api/health
```

## Traefik Contract

Traefik is the production edge and is fully automated by the playbooks:

- listens on `80` and `443`
- redirects HTTP to HTTPS
- requests Let’s Encrypt certs using `ACME_EMAIL`
- serves the canonical host `SITE_DOMAIN`
- accepts `SITE_DOMAIN_ALIASES`
- redirects aliases permanently to the canonical host
- routes to `http://<PM_APP_CONTAINER_NAME>:3000` on the shared Docker network

DNS itself is still external to this repo.

## Runtime Layout On The Server

The server-side application layout is:

```text
/home/<deploy-user>/app/shared/.env.runtime      # app container env file
/home/<deploy-user>/app/shared/data              # mounted to /app/data
/home/<deploy-user>/app/shared/uploads           # mounted to /app/uploads
/home/<deploy-user>/app/releases                 # image/version markers
/etc/traefik/dynamic/puppetmaster2.yml           # Traefik file-provider config
```

Release markers include:

- `current-image`
- `previous-image`
- `current-version`
- `previous-version`
- `latest-db-backup` when maintenance deploys create one

During Docker deploys, the playbook stops and disables known legacy host app services, removes their obsolete systemd unit files, and removes old `current-runtime` / `previous-runtime` host-runtime markers. It does not remove databases, uploads, release image markers, or backups.

## Rollback

Run:

```bash
npm run rollback
```

Rollback targets the previous app image.

Before Ansible runs, the script verifies over SSH that:

- a `previous-image` marker exists
- the marker is not empty

If either check fails, rollback stops with guidance to run a fresh deploy first.

On success, rollback:

1. pulls the previous app image
2. recreates the app container with that image
3. swaps current/previous image markers
4. swaps current/previous version markers when present
5. retries `https://$SITE_DOMAIN/api/health`

Rollback does not revert schema changes. For incompatible DB changes, plan restore/recovery separately.

## Schema Rollout Policy

Use:

- `PM_DEPLOY_SCHEMA_MODE=compatible`
  - additive, backward-compatible schema changes only
- `PM_DEPLOY_SCHEMA_MODE=maintenance`
  - requires `PM_DEPLOY_MAINTENANCE_ACK=1`
  - creates a SQLite backup before schema sync

Production deploys run reviewed SQL migrations with `npm run db:migrate:prod` inside the app image. `npm run db:push` is for local development/bootstrap only and must not be used as the production rollout path.

Rollback after a maintenance deploy is an application image rollback only, not a database rollback.

## Local Data Promotion

First setup promotes the current local SQLite/uploads state by default when the production shared paths are empty.

You still use the helper manually when you need to re-run that promotion later or overwrite an existing production dataset:

```bash
npm run deploy:sync-local-data -- --yes
```

That helper is a maintenance operation. When it overwrites the SQLite database, it stops the app container named by `PM_APP_CONTAINER_NAME`, replaces the database, verifies SQLite integrity, then restarts the container only after the integrity check succeeds.

The helper copies the local DB and uploads into the production shared data paths under `/home/<deploy-user>/app/shared/...` and writes ownership for the app container UID/GID.

## Generated Deploy Artifacts And Secret Rotation

Generated local files:

- `ansible/inventory.yml`
- `ansible/deploy-vars.yml`
- `ansible/known_hosts`

They are ignored by git and must stay local-only. `ansible/deploy-vars.yml` contains live production secrets.

If any generated deploy artifact is exposed, rotate at least:

- `DEPLOY_USER_PASSWORD`
- `PM_SETTINGS_ENCRYPTION_KEY`
- `PM_DOCKER_TOKEN`
- SMTP credentials
- S3 credentials/signing keys
- external API credentials/tokens

Generated deploy artifacts are local machine state and must not be committed.

## Quick Reference

| Command | Description |
|---|---|
| `npm run deploy:secrets` | Generate/fill local Docker-first deploy secrets |
| `npm run setup` | Blank server bootstrap + first image deploy |
| `npm run deploy` | Build image, transfer it by the configured deploy mode, schema-sync, replace container, and verify |
| `npm run rollback` | Roll back to the previous recorded app image |
| `npm run deploy:logs` | Tail app and Traefik container logs on the server |
| `npm run deploy:shell` | Open an operator shell on the server |
| `npm run deploy:sync-local-data -- --yes` | Promote local DB/uploads to `/home/<deploy-user>/app/shared/...` |
