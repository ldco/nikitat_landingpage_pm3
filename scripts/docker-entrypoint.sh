#!/bin/sh
set -eu

DB_PATH="${DATABASE_URL:-/app/data/sqlite.db}"
UPLOAD_PATH="${UPLOAD_DIR:-/app/uploads}"

mkdir -p "$(dirname "$DB_PATH")" "$UPLOAD_PATH"

# Apply database migrations — the migration runner is the authoritative
# production schema path (same runner + same /app/drizzle directory the deploy
# schema-sync container uses). Replaces the previous boot-time `drizzle-kit
# push`, which mutated the schema without a migration history.
echo "[entrypoint] Running database migrations..."
node scripts/docker-migrate.mjs

# Sync the canonical i18n catalog into the translations table (backfill + apply
# corrected SYSTEM values from i18n/system-seed.json). This is the explicit
# deploy-time sync that ships catalog fixes to the runtime DB — a routine
# `db:seed` only backfills, so without this step corrected fr/he strings would
# never reach production. CONTENT rows stay editor-owned (never overwritten).
# Disable with PM_SYNC_TRANSLATIONS_ON_BOOT=0; a failure aborts boot so the
# mismatch is surfaced immediately (same fail-fast contract as migrations).
if [ "${PM_SYNC_TRANSLATIONS_ON_BOOT:-1}" = "1" ]; then
  echo "[entrypoint] Syncing translation catalog..."
  node build/sync-translations.mjs
fi

echo "[entrypoint] Starting SvelteKit server"
exec node build/index.js
