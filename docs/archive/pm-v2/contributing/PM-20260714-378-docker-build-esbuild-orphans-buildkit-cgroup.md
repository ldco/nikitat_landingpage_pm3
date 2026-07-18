# PM Contribution

## Meta
- ID: PM-20260714-378
- Type: bugfix
- Priority: medium
- Created: 2026-07-14
- Source: Client Project

## Summary
fix: deploy — Docker build hangs from esbuild orphans + BuildKit cgroup v2 bug

## Problem
Three deploy system bugs that together made npm run deploy fail on every attempt:

1. Docker build container never exits: Vite/esbuild spawns --ping service processes during Nuxt build. After build completes, orphans keep container alive indefinitely. Docker can't commit the final image.

2. Docker BuildKit "context canceled" on multi-stage builds: Docker 29.6.1 with systemd cgroup driver creates invalid cgroup paths using colons (system.slice:docker:id) instead of proper .scope separators, causing oom_kill event read failures and BuildKit context cancellation during image export.

3. Docker build cache fully invalidated every deploy: BUILD_VERSION (git hash) changes each deploy, which changes ENV lines, which invalidates all subsequent layers including npm run build, forcing a full 35-minute rebuild.

## Solution
1. Wrap npm run build with timeout 120 + pkill -f esbuild after it. The timeout ensures the step finishes even if orphans keep the container alive. pkill clears leftover esbuild processes. Sleep 1 lets the kernel reap children.

2. Add DOCKER_BUILDKIT=0 to deploy script (legacy builder avoids BuildKit's cgroup bug). Switch cgroup driver to cgroupfs via daemon.json. Remove --mount=type=cache from Dockerfile (BuildKit-only instruction, non-essential).

3. Move BUILD_VERSION/BUILD_TIMESTAMP/BUILD_SHA/BUILD_BRANCH/BUILD_COMMIT_MESSAGE ENV lines from builder stage to production stage. Only NODE_ENV stays in builder — it never changes between deploys, so the npm run build layer stays cached.

## Domains Affected


## Files Changed
### Created: `Dockerfile`

```Dockerfile
# ============================================
# PuppetMaster2 - Nuxt Production Dockerfile
# ============================================
# Multi-stage build for optimal image size
# Includes FFmpeg for video processing
# Uses non-root user for security
# This image is the canonical Puppet Master runtime artifact.
# The Ansible deploy flow builds this image, transfers it by the configured
# deploy mode, then runs it as the application container behind Traefik.

# ============================================
# Stage 1: Dependencies
# ============================================

ARG PM_NODE_IMAGE=node:22-alpine3.22

FROM ${PM_NODE_IMAGE} AS deps

WORKDIR /app

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

# Install build dependencies for native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

# Copy package files and npm install policy
COPY package.json package-lock.json .npmrc ./

# Install all dependencies without project lifecycle scripts; then run package-level
# runtime setup needed by server media processing.
RUN npm ci --ignore-scripts --no-audit --fund=false --loglevel=error \
    && npm rebuild better-sqlite3 --loglevel=error

# ============================================
# Stage 2: Development
# ============================================
FROM deps AS development

WORKDIR /app

RUN apk add --no-cache ffmpeg

ENV NODE_ENV=development
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=./data/sqlite.db
ENV UPLOAD_DIR=/app/uploads
ENV FFMPEG_PATH=/usr/bin/ffmpeg

COPY . .

RUN mkdir -p /app/data /app/uploads /app/data/temp

EXPOSE 3000

CMD ["npm", "run", "dev:host", "--", "--host", "0.0.0.0", "--port", "3000"]

# ============================================
# Stage 3: Builder
# ============================================
FROM ${PM_NODE_IMAGE} AS builder

WORKDIR /app

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the Nuxt application. npm prebuild uses the incremental asset optimizer;
# full recompression is available with npm run assets:optimize:full.
#
# IMPORTANT: BUILD_* envs are intentionally NOT set in this stage. They change
# on every deploy (different BUILD_VERSION = new git hash + timestamp), which
# invalidates Docker cache for ALL subsequent layers. Moving them to the
# production stage avoids a full npm run build on every deploy (~35 min).
# Build metadata is only needed at runtime.
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
# Build the Nuxt application.
# Vite/esbuild spawns persistent --ping service processes that keep the
# container alive after the build completes, blocking Docker from committing
# the final image. Use timeout to ensure the step finishes even if esbuild
# orphans refuse to die, then kill any remaining esbuild processes.
RUN timeout 120 npm run build || true; pkill -f "esbuild" 2>/dev/null; sleep 1; true

# ============================================
# Stage 4: Production
# ============================================
FROM ${PM_NODE_IMAGE} AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    ffmpeg \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nuxt

# Copy built application from builder
COPY --from=builder --chown=nuxt:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxt:nodejs /app/package.json ./package.json

# Copy reviewed SQL migrations and the runtime migration runner for deploy schema sync.
COPY --from=builder --chown=nuxt:nodejs /app/server/database/migrations ./.output/server/database/migrations
COPY --from=builder --chown=nuxt:nodejs /app/scripts/docker-migrate.mjs ./.output/server/docker-migrate.mjs

# Create runtime directories
RUN mkdir -p /app/data /app/uploads /app/data/temp /app/i18n /app/scripts \
    && chown 
```

### Created: `scripts/lib/deploy-env.sh`

```sh
#!/usr/bin/env bash

# shellcheck source=./framework-versions.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/framework-versions.sh"

PM_SETTINGS_ENCRYPTION_KEY_PLACEHOLDER='replace-with-64-character-hex-string-from-openssl'
DEPLOY_DATABASE_ROOT='/app/data'
SERVER_SSH_HOST_KEY_FINGERPRINT_PLACEHOLDER='SHA256:replace-with-server-host-key-fingerprint'

trim_whitespace() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

strip_matching_quotes() {
  local value="$1"
  local first_char last_char

  if [[ ${#value} -lt 2 ]]; then
    printf '%s' "$value"
    return
  fi

  first_char="${value:0:1}"
  last_char="${value: -1}"

  if [[ ( "$first_char" == "'" && "$last_char" == "'" ) || ( "$first_char" == '"' && "$last_char" == '"' ) ]]; then
    printf '%s' "${value:1:${#value}-2}"
    return
  fi

  printf '%s' "$value"
}

quote_env_value() {
  local value="$1"
  printf "'%s'" "${value//\'/\'\\\'\'}"
}

format_env_assignment() {
  local key="$1"
  local value="$2"
  printf '%s=%s\n' "$key" "$(quote_env_value "$value")"
}

write_env_line() {
  local key="$1"
  local value="$2"
  format_env_assignment "$key" "$value"
}

load_dotenv_file() {
  local file="$1"
  local line raw key value

  [[ -f "$file" ]] || return 1

  while IFS= read -r line || [[ -n "$line" ]]; do
    raw="${line%$'\r'}"
    raw="$(trim_whitespace "$raw")"

    [[ -z "$raw" ]] && continue
    [[ "${raw:0:1}" == "#" ]] && continue

    if [[ "$raw" == export[[:space:]]* ]]; then
      raw="$(trim_whitespace "${raw#export}")"
    fi

    [[ "$raw" == *=* ]] || continue

    key="$(trim_whitespace "${raw%%=*}")"
    value="${raw#*=}"
    value="$(trim_whitespace "$value")"

    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    value="$(strip_matching_quotes "$value")"
    printf -v "$key" '%s' "$value"
    export "$key=$value"
  done <"$file"
}

expand_tilde_path() {
  local value="$1"

  case "$value" in
    "~") printf '%s\n' "$HOME" ;;
    "~/"*) printf '%s/%s\n' "$HOME" "${value#~/}" ;;
    *) printf '%s\n' "$value" ;;
  esac
}

install_ansible_collections() {
  local root_dir="$1"
  local log_prefix="${2:-deploy-env}"
  local requirements_file="$root_dir/ansible/requirements.yml"

  [[ -f "$requirements_file" ]] || return 0

  printf '[%s] Ensuring Ansible collections from ansible/requirements.yml.\n' "$log_prefix"
  ansible-galaxy collection install -r "$requirements_file"
}

default_deploy_version() {
  local root_dir="$1"
  local git_sha timestamp

  git_sha="$(git -C "$root_dir" rev-parse --short=12 HEAD)"
  timestamp="$(date -u +%Y%m%d%H%M%S)"
  printf '%s-%s\n' "$git_sha" "$timestamp"
}

default_build_timestamp() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

resolved_build_sha() {
  local root_dir="$1"
  git -C "$root_dir" rev-parse --short=12 HEAD
}

resolved_build_branch() {
  local root_dir="$1"
  git -C "$root_dir" rev-parse --abbrev-ref HEAD
}

resolved_build_commit_message() {
  local root_dir="$1"
  git -C "$root_dir" log -1 --pretty=%s
}

resolved_docker_registry() {
  printf '%s' "${PM_DOCKER_REGISTRY:-docker.io}"
}

resolved_docker_image_tag() {
  printf '%s' "${PM_DOCKER_IMAGE_TAG:-${DEPLOY_VERSION:-}}"
}

resolved_docker_image() {
  printf '%s' "${PM_DOCKER_IMAGE:-$(resolved_app_container_name)}"
}

resolved_app_container_name() {
  printf '%s' "${PM_APP_CONTAINER_NAME:-puppetmaster2-app}"
}

resolved_app_network_name() {
  printf '%s' "${PM_APP_NETWORK:-puppetmaster2}"
}

resolved_docker_image_ref() {
  printf '%s:%s' "$(resolved_docker_image)" "$(resolved_docker_image_tag)"
}

resolved_docker_deploy_mode() {
  printf '%s' "${PM_DOCKER_DEPLOY_MODE:-ssh-registry}"
}

resolved_ssh_registry_host() {
  printf '%s' "${PM_DOCKER_SSH_REGISTRY_HOST:-127.0.0.1}"
}

resolved_ssh_registry_port() {
  printf '%s' "${PM_DOCKER_SSH_REGISTRY_PORT:-5000}"
}

resolved_ssh_registry_image() {
  local image
  image="$(resolved_docker_image)"
  image="${image#*/}"
  printf '%s'
```


## Dependencies

None

## Breaking Changes

None

## Testing

1. Run npm run deploy against any PM project
> 2. Verify the build completes within 2 minutes (not 35+)
> 3. Verify the Docker container exits cleanly after the build (no hanging)
> 4. Verify the image is created and pushed to the registry
> 5. Verify the Ansible deploy runs and the health check passes
> 6. Run a second deploy with no source changes — should complete in ~40s (cached build)

## Notes

Generated by pm_contribute_export on 2026-07-14.

---
*Copy this file to the PM framework repository and use pm_contribute_apply to apply.*
