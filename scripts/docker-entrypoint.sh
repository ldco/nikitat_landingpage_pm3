#!/bin/sh
set -eu

DB_PATH="${DATABASE_URL:-/app/data/sqlite.db}"
UPLOAD_PATH="${UPLOAD_DIR:-/app/uploads}"

mkdir -p "$(dirname "$DB_PATH")" "$UPLOAD_PATH" /app/data/temp

# Schema sync is performed by setup/deploy as a serialized external step.
# First-time setup prepares the blank database before the first app boot.
echo "[entrypoint] Starting Nuxt server"
exec node .output/server/index.mjs
