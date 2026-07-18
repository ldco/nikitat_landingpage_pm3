# Docker-First Deployment Migration Plan

## Decision

Puppet Master deployment will standardize on Docker-first application runtime.
Every PM app should deploy as a versioned Docker image managed by Ansible with the
`community.docker` collection. Host `systemd` app runtime is removed from the
canonical operator flow.

## Target Contract

- Build artifact: Docker image.
- Image transfer: default `PM_DOCKER_DEPLOY_MODE=ssh-registry`, which builds on the dev PC and pushes changed layers through an SSH tunnel to a private server-local registry.
- Image name: `PM_DOCKER_IMAGE`, default `puppetmaster2-app`.
- Image tag: generated deploy build version unless `PM_DOCKER_IMAGE_TAG` is set.
- Registry auth: `PM_DOCKER_USERNAME` and `PM_DOCKER_TOKEN`, only when `PM_DOCKER_DEPLOY_MODE=registry`.
- Local fallback: `PM_DOCKER_DEPLOY_MODE=local` streams the full image over SSH and is reserved for diagnostics/emergency use.
- App container: `PM_APP_CONTAINER_NAME`, default `puppetmaster2-app`.
- Traefik container: `puppetmaster2-traefik`.
- Network: `PM_APP_NETWORK`, default `puppetmaster2`.
- App port: `3000` inside the Docker network.
- Data mounts:
  - `/home/<deploy-user>/app/shared/data:/app/data`
  - `/home/<deploy-user>/app/shared/uploads:/app/uploads`
- Runtime env file:
  - `/home/<deploy-user>/app/shared/.env.runtime`
- Rollback markers:
  - `current-image`
  - `previous-image`
  - `current-version`
  - `previous-version`

## Migration Steps

1. Add SSH-private-registry Docker image env contract to `.env.example` and deploy var rendering.
2. Update Dockerfile comments and runtime paths for PM Docker-first deployment.
3. Change `npm run setup` and `npm run deploy` to build, tag, and push changed layers through the private registry tunnel; keep full stream and external registry modes explicit optional paths.
4. Convert `ansible/deploy-app.yml` (now `ansible/deploy.yml`) from host runtime bundle + systemd to:
   - Docker login
   - Docker network
   - app image pull
   - env file write
   - app container start/recreate
   - Traefik container start on the same Docker network
   - image/version marker persistence
5. Convert `ansible/rollback-app.yml` from runtime symlink rollback to previous-image rollback.
6. Update docs to make Docker-first the only public deployment path.
7. Validate:
   - shell parse checks
   - Ansible syntax checks
   - local Docker image build
   - production deploy
   - production health check
   - rollback dry run or controlled rollback test

## Cutover Safety

- The first Docker deploy should stop/disable the old host `puppetmaster2.service`.
- Existing shared data paths are preserved, so SQLite/uploads do not require content migration.
- Old runtime bundle markers are removed by the Docker deploy playbook after the cutover. Databases/uploads/backups are preserved.
- If Docker deploy fails before app container replacement, the previous production app may still be running.
- If Docker deploy replaces the app container and health fails, use Docker image rollback.
