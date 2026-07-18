# Deploy

The public production path for Puppet Master projects is Docker-first:

- build one versioned application Docker image locally
- by default push only changed image layers through an SSH tunnel to a private
  registry on the target server
- provision/orchestrate the host with Ansible
- run the app as a Docker container on the shared Docker network
- run Traefik as the Docker TLS/reverse-proxy edge

The app is not deployed as a host `systemd` service in the canonical operator flow.

## Release model

Production releases are manual operator actions from a trusted workstation or admin PC. A push to `master`, `main`, or any other branch does not deploy production. CI workflows may validate code, but they do not receive production deploy secrets, do not generate deploy `.env` files, and do not run `scripts/deploy.sh`.

The release command is:

```bash
npm run deploy
```

Use this from the machine that owns the target server `.env`, SSH trust, and local-only Ansible artifacts.

## Required local tools

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

## Required `.env` values

Generate and fill the baseline deploy contract first:

```bash
npm run deploy:secrets
```

If you intentionally choose registry mode, pass the registry token through the environment when you want the script to store it:

```bash
PM_DOCKER_TOKEN=your_registry_token npm run deploy:secrets
```

The script generates `DEPLOY_USER_PASSWORD` and `PM_SETTINGS_ENCRYPTION_KEY`, then writes the Docker-first keys below. Values that cannot be safely generated, such as `SERVER_IP`, `SITE_DOMAIN`, `ACME_EMAIL`, `DEPLOY_SSH_KEY`, and optional registry credentials, must still come from the operator or secret manager.

```env
APP_VERSION=0.1.0
SERVER_IP=...
SITE_DOMAIN=example.com
SITE_DOMAIN_ALIASES=www.example.com
ACME_EMAIL=admin@example.com
DEPLOY_USER=deploy
SSH_KEY=false
SERVER_ROOT_PASSWORD=...
DEPLOY_USER_PASSWORD=...
PM_DEPLOY_DATABASE_URL=/app/data/sqlite.db
PM_SETTINGS_ENCRYPTION_KEY=<literal-64-char-hex-secret>
PM_DOCKER_REGISTRY=
PM_DOCKER_DEPLOY_MODE=ssh-registry
PM_DOCKER_IMAGE=puppetmaster2-app
PM_DOCKER_USERNAME=
PM_DOCKER_TOKEN=
PM_DOCKER_SSH_REGISTRY_HOST=127.0.0.1
PM_DOCKER_SSH_REGISTRY_PORT=5000
PM_DOCKER_STREAM_COMPRESSION=zstd
```

`PM_DOCKER_IMAGE_TAG` is optional. When omitted, deploy uses the generated build version, based on deploy time and git SHA.
`PM_DOCKER_DEPLOY_MODE` defaults to `ssh-registry` for dev-PC operators. This starts a private `registry:2` container on the server bound to `127.0.0.1:5000`, opens an SSH tunnel from the operator PC, and uses Docker push/pull so unchanged layers are reused. No Docker Hub, GHCR, GitHub, or GitLab deploy service is required.
If the server does not already have the private registry image, setup/deploy loads `PM_DOCKER_SSH_REGISTRY_IMAGE` from the operator PC over SSH before starting the registry. The default is `registry:2`.
`local` is an emergency fallback that streams a full `docker save` archive over SSH. `PM_DOCKER_STREAM_COMPRESSION` controls only that fallback. Set `registry` only when the image should be pushed to an external registry and pulled by the server.

## First-time setup

```bash
npm run setup
```

This:

1. validates `.env`
2. bootstraps host trust into the managed known-hosts file
3. creates or repairs deploy access
4. generates local-only Ansible artifacts:
   - `ansible/inventory.yml`
   - `ansible/deploy-vars.yml`
5. provisions the server with Ansible
6. starts a private server registry for `ssh-registry` mode
7. builds the versioned app Docker image, then either pushes changed layers through the SSH tunnel, streams a full archive in `local` fallback mode, or pushes to an external registry
8. writes `/home/<deploy-user>/app/shared/.env.runtime`
9. creates the Docker network and shared data/upload directories
10. if `/home/<deploy-user>/app/shared/...` is empty, auto-promotes local SQLite DB/uploads
11. runs reviewed SQL migrations inside the app image
12. starts/recreates the app container
13. starts/recreates Traefik on the same Docker network
14. records current/previous image and version markers
15. retries `https://$SITE_DOMAIN/api/health`

## Normal deploy

```bash
npm run deploy
```

This repeats image build/transfer, schema sync, container replacement, marker update, and bounded health-check retries.

For default `ssh-registry` mode, image transfer is self-contained over SSH. The private registry listens only on server loopback, and the operator PC reaches it through a temporary SSH tunnel. Docker push sends only missing layers, which avoids repeated full-image transfers after the first deploy.

For `local` fallback mode, the script streams the whole image over SSH. No external registry is used, but this mode is intentionally slower for normal releases. The framework-required transfer codec is `zstd`; the deploy script logs the selected compression codec.

`npm run setup` installs `zstd` through Ansible. `npm run deploy` also runs a lightweight pre-stream repair that installs `zstd` on existing servers before `docker save` starts. If the operator PC is missing `zstd`, deploy fails immediately with the install command.

Install the local deploy dependency on the operator PC:

```bash
sudo apt-get update
sudo apt-get install -y zstd
```

Deploy hard-fails before container changes if:

- required Docker registry/image settings are missing
- `PM_DEPLOY_DATABASE_URL` is not inside `/app/data`
- schema rollout mode is invalid
- encryption key validation fails

Health retries are configurable:

```env
PM_DEPLOY_HEALTH_RETRIES=8
PM_DEPLOY_HEALTH_INITIAL_DELAY_SECONDS=3
PM_DEPLOY_HEALTH_BACKOFF_SECONDS=3
PM_DEPLOY_HEALTH_CONNECT_TIMEOUT_SECONDS=5
PM_DEPLOY_HEALTH_MAX_TIME_SECONDS=15
```

## Maintenance permission repair

Normal deploys only ensure the top-level shared data and upload directories have the app container UID/GID. They do not run recursive ownership repair on every release, because that scales with upload volume and can dominate deploy time.

Recursive repair is automatic only after legacy SQLite/upload migration tasks actually move old data. For manual maintenance, run:

```bash
PM_DEPLOY_REPAIR_SHARED_OWNERSHIP=true npm run deploy
```

Use this only when file ownership under `/home/<deploy-user>/app/shared/data` or `/home/<deploy-user>/app/shared/uploads` is known to be broken. Large upload trees can make this repair slow.

If the final health check still fails, the scripts print container diagnostics:

- `npm run deploy:logs`
- `docker ps --filter name=puppetmaster2`
- `docker logs puppetmaster2-app --tail 200`
- `docker logs puppetmaster2-traefik --tail 200`
- `curl -vk https://$SITE_DOMAIN/api/health`

## Rollback

```bash
npm run rollback
```

Rollback uses recorded image markers:

- `current-image`
- `previous-image`
- `current-version`
- `previous-version`

It will fail before Ansible runs if no previous image marker exists or the marker is empty.

On success it:

1. pulls the previous app image
2. recreates the app container with that image
3. swaps current/previous image markers
4. swaps current/previous version markers when available
5. retries `https://$SITE_DOMAIN/api/health`

Rollback is not a database rollback. If the failed release applied incompatible schema changes, plan DB recovery separately.

## Schema rollout policy

Production deploys run reviewed SQL migrations with `npm run db:migrate:prod` inside the app image. `npm run db:push` is for local development/bootstrap only and must not be used as the production rollout path.

For breaking schema releases:

- set `PM_DEPLOY_SCHEMA_MODE=maintenance`
- set `PM_DEPLOY_MAINTENANCE_ACK=1`
- open a maintenance/read-only window before deploy
- verify a fresh SQLite backup exists before the app container is replaced
- plan database restore/recovery separately from image rollback

## TLS and domain automation

Traefik is managed by Ansible and remains the TLS edge:

- listens on `80` and `443`
- redirects HTTP to HTTPS
- requests Let’s Encrypt certificates using `ACME_EMAIL`
- routes `SITE_DOMAIN`
- routes alias domains and redirects them to the canonical domain

DNS itself is not automated. `SITE_DOMAIN` and every alias must already resolve to the server IP.

## Generated secret artifacts

`ansible/inventory.yml` and `ansible/deploy-vars.yml` are generated from `.env`, contain live connection data and production secrets, and must stay local-only.

If either file is exposed, rotate at least:

- `DEPLOY_USER_PASSWORD`
- `PM_SETTINGS_ENCRYPTION_KEY`
- `PM_DOCKER_TOKEN`
- SMTP credentials
- S3 credentials and signing keys
- external API credentials/tokens

Generated deploy artifacts are local machine state and must not be committed.
