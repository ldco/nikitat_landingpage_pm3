#!/bin/sh
set -eu

DB_PATH="${DATABASE_URL:-/app/data/sqlite.db}"
UPLOAD_PATH="${UPLOAD_DIR:-/app/uploads}"

mkdir -p "$(dirname "$DB_PATH")" "$UPLOAD_PATH"

# Run DB schema push on first boot (non-fatal if it fails)
echo "[entrypoint] Running DB schema push..."
npx drizzle-kit push 2>/dev/null || echo "[entrypoint] DB push skipped"

echo "[entrypoint] Starting SvelteKit server"
exec node .output/server/index.mjs
