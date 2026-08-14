#!/usr/bin/env bash
set -euo pipefail

# Pull the nikitat.pro production content (PM v2 SQLite DB + uploads) into a
# local staging area, READ-ONLY against production. The pulled DB is then
# consumed by scripts/import-pm2-content.ts to seed the PM v3 database.
#
# Usage:
#   ./scripts/pull-production-content.sh [--sync-uploads] [--dest-dir <dir>]
#
# Snapshot strategy (production runs the app in Docker, WAL-mode SQLite):
#   1. Try the shared-volume DB path directly (deploy user usually lacks
#      permission — the volume is chmod 770, owned by the app uid).
#   2. Fall back to a CONSISTENT online backup: the deploy user (sudo group,
#      password from the env file) runs host `sqlite3 <db> ".backup <file>"`
#      (SQLite online-backup API — atomic even while the app writes), streams
#      the single clean file back over the ssh session, and a REMOTE EXIT trap
#      removes the temp copy on the server — so no DB copy is ever left behind
#      on production, even if the local client dies mid-transfer.
#
# All remote command interpolation is shell-escaped with printf %q (values
# like PM_LIVE_DB / PM_LIVE_CONTAINER can never break out of quoting).
#
# Environment overrides:
#   PM_LIVE_ENV_FILE    .env file holding DEPLOY_USER_PASSWORD (default: ../app-nuxt/.env)
#   PM_LIVE_SERVER      SSH host (default: 77.232.128.122)
#   PM_LIVE_USER        SSH user (default: deploy)
#   PM_LIVE_DB          remote DB path (default: /home/deploy/app/shared/nikitat-pro/data/sqlite.db)
#   PM_LIVE_CONTAINER   app container name (default: pm-nikitat-pro-app)
#   PM_LIVE_UPLOADS     remote uploads dir (default: .../uploads)
#   PM_LIVE_KNOWN_HOSTS known_hosts file with the server fingerprint (default: ../app-nuxt/ansible/known_hosts)
#   PM_IMPORT_DIR       local staging dir (default: data/import/from-production)
#   PM_UPLOADS_DEST     local uploads root (default: public/uploads)

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LIVE_ENV_FILE="${PM_LIVE_ENV_FILE:-$ROOT_DIR/../app-nuxt/.env}"
LIVE_SERVER="${PM_LIVE_SERVER:-77.232.128.122}"
LIVE_USER="${PM_LIVE_USER:-deploy}"
LIVE_DB="${PM_LIVE_DB:-/home/deploy/app/shared/nikitat-pro/data/sqlite.db}"
LIVE_CONTAINER="${PM_LIVE_CONTAINER:-pm-nikitat-pro-app}"
LIVE_UPLOADS="${PM_LIVE_UPLOADS:-/home/deploy/app/shared/nikitat-pro/uploads}"
KNOWN_HOSTS="${PM_LIVE_KNOWN_HOSTS:-$ROOT_DIR/../app-nuxt/ansible/known_hosts}"
IMPORT_DIR="${PM_IMPORT_DIR:-$ROOT_DIR/data/import/from-production}"
UPLOADS_DEST="${PM_UPLOADS_DEST:-$ROOT_DIR/public/uploads}"
SYNC_UPLOADS=0

usage() {
  cat <<'USAGE'
Usage: ./scripts/pull-production-content.sh [--sync-uploads] [--dest-dir <dir>]
  --sync-uploads   also pull the remote uploads tree into public/uploads
                   (additive: only files missing locally are added)
  --dest-dir <dir> staging directory for the pulled DB (default: data/import/from-production)
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --sync-uploads) SYNC_UPLOADS=1 ;;
    --dest-dir)
      [ $# -ge 2 ] || { echo "Missing value for --dest-dir" >&2; exit 2; }
      if [[ "$2" == /* ]]; then
        IMPORT_DIR="$2"
      else
        IMPORT_DIR="$ROOT_DIR/$2"
      fi
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

for cmd in sshpass ssh sqlite3; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Missing required command: $cmd" >&2; exit 1; }
done

[ -f "$LIVE_ENV_FILE" ] || { echo "Missing live env file: $LIVE_ENV_FILE (set PM_LIVE_ENV_FILE)" >&2; exit 1; }
[ -f "$KNOWN_HOSTS" ] || { echo "Missing known_hosts: $KNOWN_HOSTS (set PM_LIVE_KNOWN_HOSTS)" >&2; exit 1; }

PW="$(grep -E '^DEPLOY_USER_PASSWORD=' "$LIVE_ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
[ -n "$PW" ] || { echo "DEPLOY_USER_PASSWORD not found in $LIVE_ENV_FILE" >&2; exit 1; }
export SSHPASS="$PW"
unset PW

SSH_OPTS=(-o StrictHostKeyChecking=yes -o UserKnownHostsFile="$KNOWN_HOSTS" \
  -o PreferredAuthentications=password -o PubkeyAuthentication=no -o ConnectTimeout=15)
REMOTE="$LIVE_USER@$LIVE_SERVER"
DB_DEST="$IMPORT_DIR/sqlite.db"
mkdir -p "$IMPORT_DIR"

# Shell-escape a value for safe interpolation into a remote command string.
shell_escape() { printf '%q' "$1"; }

echo "[pull] Checking remote host: $REMOTE"
if ! sshpass -e ssh "${SSH_OPTS[@]}" "$REMOTE" "echo CONNECT_OK" >/dev/null 2>&1; then
  echo "[pull] FAILED: cannot SSH to $REMOTE (password auth)." >&2
  exit 3
fi

echo "[pull] Testing direct read of $LIVE_DB ..."
DIRECT_OK="$(sshpass -e ssh "${SSH_OPTS[@]}" "$REMOTE" "test -r $(shell_escape "$LIVE_DB") && echo YES || echo NO")"

if [ "$DIRECT_OK" = "YES" ]; then
  echo "[pull] Direct path readable; pulling as-is"
  sshpass -e scp "${SSH_OPTS[@]}" "$REMOTE:$(shell_escape "$LIVE_DB")" "$DB_DEST"
else
  echo "[pull] Direct path not readable — consistent online backup via container volume"
  REMOTE_TMP="/home/$LIVE_USER/pm-data-$(date +%s)"

  # Runs entirely on the remote host in ONE ssh session: snapshot via host
  # sqlite3 (sudo, online-backup API), stream the clean file to stdout, and
  # remove the temp dir server-side via an EXIT trap — even if the client
  # dies, the production DB copy never lingers.
  REMOTE_SNAPSHOT="set -eu
TMP_DIR=$(shell_escape "$REMOTE_TMP")
DB_PATH=$(shell_escape "$LIVE_DB")
SUDO_PW=$(shell_escape "$SSHPASS")
SN=\"\$TMP_DIR/sqlite.clean.db\"
cleanup() {
  printf '%s\\n' \"\$SUDO_PW\" | sudo -S -p '' rm -rf \"\$TMP_DIR\" >/dev/null 2>&1 || true
}
trap cleanup EXIT
mkdir -p \"\$TMP_DIR\"
printf '%s\\n' \"\$SUDO_PW\" | sudo -S -p '' sqlite3 \"\$DB_PATH\" \".backup '\$SN'\" >/dev/null 2>&1
printf '%s\\n' \"\$SUDO_PW\" | sudo -S -p '' chown \"\$(id -un):\$(id -gn)\" \"\$SN\" >/dev/null 2>&1 || true
sqlite3 \"\$SN\" 'PRAGMA integrity_check;' >&2
cat \"\$SN\""

  echo "[pull] Streaming snapshot to $DB_DEST"
  if ! sshpass -e ssh "${SSH_OPTS[@]}" "$REMOTE" "$REMOTE_SNAPSHOT" > "$DB_DEST"; then
    echo "[pull] FAILED: remote snapshot (see messages above)." >&2
    exit 4
  fi
fi

echo "[pull] Verifying local integrity..."
OK="$(sqlite3 "$DB_DEST" "PRAGMA integrity_check;")"
if [ "$OK" != "ok" ]; then
  echo "[pull] FAILED: local integrity check = $OK" >&2
  exit 5
fi
TABLES="$(sqlite3 "$DB_DEST" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")"
echo "[pull] OK. Tables: $TABLES"

if [ "$SYNC_UPLOADS" -eq 1 ]; then
  echo "[pull] Pulling uploads (additive) -> $UPLOADS_DEST"
  STAGING="$(mktemp -d)"
  if [ "$DIRECT_OK" = "YES" ]; then
    sshpass -e ssh "${SSH_OPTS[@]}" "$REMOTE" "tar -C $(shell_escape "$LIVE_UPLOADS") -cf - ." 2>/dev/null \
      | tar -xf - -C "$STAGING"
  else
    sshpass -e ssh "${SSH_OPTS[@]}" "$REMOTE" \
      "docker exec $(shell_escape "$LIVE_CONTAINER") sh -c 'cd /app/uploads && tar -cf - .'" 2>/dev/null \
      | tar -xf - -C "$STAGING"
  fi
  mkdir -p "$UPLOADS_DEST"
  rsync -a --ignore-existing "$STAGING/" "$UPLOADS_DEST/"
  rm -rf "$STAGING"
  echo "[pull] Uploads synced."
fi

echo "[pull] Done. Staged DB: $DB_DEST"
echo "[pull] Next: tsx --env-file=.env scripts/import-pm2-content.ts '$DB_DEST' --dry-run"
