# ============================================
# PuppetMaster3 - SvelteKit Production Dockerfile
# ============================================
# Multi-stage build for optimal image size
# Includes FFmpeg for video processing
# Uses non-root user for security

# ============================================
# Stage 1: Dependencies
# ============================================

ARG PM_NODE_IMAGE=node:22-alpine3.22

FROM ${PM_NODE_IMAGE} AS deps

WORKDIR /app

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false

# Install build dependencies for native modules (better-sqlite3, sharp)
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

COPY package.json package-lock.json .npmrc ./

# Install all dependencies; rebuild native modules
RUN npm ci --ignore-scripts --no-audit --fund=false --loglevel=error \
    && npm rebuild better-sqlite3 --loglevel=error

# ============================================
# Stage 2: Builder
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

# Build the SvelteKit application
# SvelteKit adapter-node outputs to .output/
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM ${PM_NODE_IMAGE} AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    ffmpeg \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 sveltekit

# Copy built application from builder (adapter-node outputs to build/)
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
# Runtime dependencies — the adapter externalizes native/ESM deps
# (better-sqlite3, drizzle-orm, otpauth, …), so node_modules must be shipped.
# The deps stage already rebuilt better-sqlite3 for this Alpine base.
COPY --from=deps --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./package.json
# Deploy/runtime scripts — the migration runner (schema-sync container + boot)
# and the admin password rotation task both execute from /app/scripts.
COPY --from=builder --chown=sveltekit:nodejs /app/scripts/docker-migrate.mjs ./scripts/docker-migrate.mjs
COPY --from=builder --chown=sveltekit:nodejs /app/scripts/rotate-admin-passwords.mjs ./scripts/rotate-admin-passwords.mjs
COPY --from=builder --chown=sveltekit:nodejs /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh
RUN chmod +x /app/scripts/docker-entrypoint.sh

# Create runtime directories
RUN mkdir -p /app/data /app/i18n && chown -R sveltekit:nodejs /app/data /app/i18n

# Copy Drizzle migrations and seed data — /app/drizzle is the single shipped
# migration directory (docker-migrate.mjs resolves it relative to process.cwd()).
COPY --from=builder --chown=sveltekit:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=sveltekit:nodejs /app/i18n/system-seed.json ./i18n/system-seed.json

# Environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=/app/data/sqlite.db
ENV UPLOAD_DIR=/app/uploads
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Build metadata
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
USER sveltekit

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["./scripts/docker-entrypoint.sh"]
