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
    && chown -R nuxt:nodejs /app/data /app/uploads /app/i18n /app/scripts

# Copy runtime seed data and startup entrypoint
COPY --from=builder --chown=nuxt:nodejs /app/i18n/system-seed.json ./i18n/system-seed.json
COPY --from=builder --chown=nuxt:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
COPY --from=builder --chown=nuxt:nodejs /app/scripts/ops-agent.mjs ./scripts/ops-agent.mjs
COPY --from=builder --chown=nuxt:nodejs /app/scripts/rotate-admin-passwords.mjs ./scripts/rotate-admin-passwords.mjs
RUN chmod +x /app/scripts/docker-entrypoint.sh

# Environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=/app/data/sqlite.db
ENV UPLOAD_DIR=/app/uploads
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

# Build metadata (set here, not in builder stage, to preserve Docker cache
# across deploys — these change on every git push).
ARG BUILD_VERSION=
ARG BUILD_TIMESTAMP=
ARG BUILD_SHA=
ARG BUILD_BRANCH=
ARG BUILD_COMMIT_MESSAGE=
ENV BUILD_VERSION=${BUILD_VERSION}
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV BUILD_SHA=${BUILD_SHA}
ENV BUILD_BRANCH=${BUILD_BRANCH}
ENV BUILD_COMMIT_MESSAGE=${BUILD_COMMIT_MESSAGE}

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["./scripts/docker-entrypoint.sh"]
