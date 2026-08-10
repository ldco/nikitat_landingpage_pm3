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

echo "[entrypoint] Starting SvelteKit server"
exec node build/index.js
