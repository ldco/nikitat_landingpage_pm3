#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${PM_LOCAL_ENV:-$ROOT_DIR/.env}"
DB_SOURCE="$ROOT_DIR/data/sqlite.db"
UPLOADS_SOURCE="$ROOT_DIR/public/uploads"
DEPLOY_USER="deploy"
DEPLOY_KNOWN_HOSTS_FILE=''
OVERWRITE_DB=0
REPLACE_UPLOADS=0
SKIP_DB=0
SYNC_UPLOADS=1
YES=0

# shellcheck source=./lib/deploy-env.sh
source "$ROOT_DIR/scripts/lib/deploy-env.sh"

usage() {
  cat <<'EOF'
Usage:
  npm run deploy:sync-local-data -- --yes [options]

Options:
  --db <path>                    Local SQLite DB to promote. Default: data/sqlite.db
  --uploads <path>               Local uploads directory. Default: public/uploads
  --skip-db                      Promote uploads only.
  --skip-uploads                 Promote DB only.
  --overwrite-production-db      Replace an existing production DB after creating a backup.
  --replace-uploads              Clear production uploads directory before extracting local uploads.
  --yes                          Required. Confirms this should write to the remote shared runtime data.

Environment overrides:
  PM_LOCAL_ENV                   Path to local .env.
  PM_DEPLOY_SERVER_IP            Server IP override. Defaults to SERVER_IP from .env.
  DEPLOY_USER / PM_DEPLOY_USER   SSH user. Default: deploy.
  SSH_KEY                        true for key auth, false for password auth.
  PM_DEPLOY_AUTH_MODE            Legacy auth mode: password or ssh_key.
  PM_DEPLOY_SSH_KEY              SSH private key path when PM_DEPLOY_AUTH_MODE=ssh_key.
  PM_DEPLOY_DATABASE_URL         Production SQLite path. Default: DATABASE_URL.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --db)
      DB_SOURCE=$2
      shift 2
      ;;
    --uploads)
      UPLOADS_SOURCE=$2
      shift 2
      ;;
    --skip-db)
      SKIP_DB=1
      shift
      ;;
    --skip-uploads)
      SYNC_UPLOADS=0
      shift
      ;;
    --overwrite-production-db)
      OVERWRITE_DB=1
      shift
      ;;
    --replace-uploads)
      REPLACE_UPLOADS=1
      shift
      ;;
    --yes)
      YES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ "$YES" -ne 1 ]; then
  echo "Refusing to write remote shared runtime data without --yes." >&2
  usage >&2
  exit 2
fi

if [ "$SKIP_DB" -eq 1 ] && [ "$SYNC_UPLOADS" -eq 0 ]; then
  echo "Nothing to sync: both DB and uploads are disabled." >&2
  exit 2
fi

for cmd in ssh scp tar sqlite3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
done

for cmd in ssh-keyscan ssh-keygen; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
done

[ -f "$ENV_FILE" ] || { echo "Missing local env file: $ENV_FILE" >&2; exit 1; }
load_dotenv_file "$ENV_FILE"

SERVER_IP="${PM_DEPLOY_SERVER_IP:-${SERVER_IP:-}}"
DEPLOY_AUTH_MODE="$(resolved_deploy_auth_mode)"
DEPLOY_USER="$(resolved_deploy_user)"
DEPLOY_KNOWN_HOSTS_FILE="$(resolved_deploy_known_hosts_file "$ROOT_DIR")"
validate_deploy_auth_mode || exit 1
validate_deploy_user || exit 1
validate_deploy_database_url || exit 1
DATABASE_RELATIVE_PATH="$(resolved_database_relative_path)"
REMOTE_DB_TMP_NAME="$(basename "$DATABASE_RELATIVE_PATH")"
REMOTE_SHARED_ROOT="/home/$DEPLOY_USER/app/shared"
PROJECT_ID="${SITE_DOMAIN//./-}"
REMOTE_DB_PATH="$REMOTE_SHARED_ROOT/$PROJECT_ID/data/$DATABASE_RELATIVE_PATH"
REMOTE_UPLOADS_PATH="$REMOTE_SHARED_ROOT/$PROJECT_ID/uploads"
REMOTE_APP_CONTAINER_NAME="$(resolved_app_container_name)"
REMOTE_APP_UID=1001
REMOTE_APP_GID=1001

if [ -z "$SERVER_IP" ] || [ "$SERVER_IP" = "123.45.67.89" ]; then
  echo "SERVER_IP is not configured in $ENV_FILE." >&2
  exit 1
fi

if [ "$SKIP_DB" -ne 1 ] && [ ! -f "$DB_SOURCE" ]; then
  echo "Local SQLite DB not found: $DB_SOURCE" >&2
  exit 1
fi

bootstrap_known_host_entry "$ROOT_DIR" "$SERVER_IP" || {
  echo "Host trust bootstrap failed. Check SSH reachability, then rerun." >&2
  exit 1
}

SSH_BASE=(ssh -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE")
SCP_BASE=(scp -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE")

case "$DEPLOY_AUTH_MODE" in
  ssh_key)
    DEPLOY_SSH_KEY="${PM_DEPLOY_SSH_KEY:-${DEPLOY_SSH_KEY:-}}"
    DEPLOY_SSH_KEY="$(expand_tilde_path "$DEPLOY_SSH_KEY")"
    if [ -z "$DEPLOY_SSH_KEY" ] || [ ! -f "$DEPLOY_SSH_KEY" ]; then
      echo "DEPLOY_SSH_KEY is not configured or does not exist: $DEPLOY_SSH_KEY" >&2
      exit 1
    fi
    SSH_BASE=(ssh -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE" -i "$DEPLOY_SSH_KEY" -o BatchMode=yes)
    SCP_BASE=(scp -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE" -i "$DEPLOY_SSH_KEY")
    ;;
  password)
    if ! command -v sshpass >/dev/null 2>&1; then
      echo "Missing required command: sshpass" >&2
      exit 1
    fi
    if [ -z "${DEPLOY_USER_PASSWORD:-}" ]; then
      echo "DEPLOY_USER_PASSWORD is not configured in $ENV_FILE." >&2
      exit 1
    fi
    SSH_BASE=(sshpass -p "$DEPLOY_USER_PASSWORD" ssh -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
    SCP_BASE=(sshpass -p "$DEPLOY_USER_PASSWORD" scp -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
    ;;
  *)
    echo "Unsupported PM_DEPLOY_AUTH_MODE: $DEPLOY_AUTH_MODE" >&2
    exit 1
    ;;
esac

REMOTE="$DEPLOY_USER@$SERVER_IP"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
TMP_DIR=$(mktemp -d)
REMOTE_TMP="/tmp/pm-deploy-sync-$STAMP"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

if [ "$SKIP_DB" -ne 1 ]; then
  echo "[deploy-sync] Creating consistent SQLite backup from $DB_SOURCE"
  sqlite3 "$DB_SOURCE" ".backup '$TMP_DIR/$REMOTE_DB_TMP_NAME'"
fi

if [ "$SYNC_UPLOADS" -eq 1 ] && [ -d "$UPLOADS_SOURCE" ]; then
  echo "[deploy-sync] Packing uploads from $UPLOADS_SOURCE"
  (cd "$UPLOADS_SOURCE" && tar -czf "$TMP_DIR/uploads.tar.gz" .)
fi

echo "[deploy-sync] Preparing remote temp directory on $REMOTE"
"${SSH_BASE[@]}" "$REMOTE" "mkdir -p '$REMOTE_TMP'"
if [ "$SKIP_DB" -ne 1 ]; then
  "${SCP_BASE[@]}" "$TMP_DIR/$REMOTE_DB_TMP_NAME" "$REMOTE:$REMOTE_TMP/$REMOTE_DB_TMP_NAME" >/dev/null

  echo "[deploy-sync] Installing SQLite DB into $REMOTE_DB_PATH"
  "${SSH_BASE[@]}" "$REMOTE" sh -s -- "$REMOTE_TMP" "$OVERWRITE_DB" "$STAMP" "$REMOTE_DB_PATH" "$REMOTE_DB_TMP_NAME" "$REMOTE_APP_UID" "$REMOTE_APP_GID" "$REMOTE_APP_CONTAINER_NAME" "${DEPLOY_USER_PASSWORD:-}" <<'REMOTE_DB'
set -eu
REMOTE_TMP=$1
OVERWRITE_DB=$2
STAMP=$3
TARGET_PATH=$4
REMOTE_DB_TMP_NAME=$5
REMOTE_APP_UID=$6
REMOTE_APP_GID=$7
APP_CONTAINER_NAME=$8
SUDO_PASSWORD=$9
TARGET_DIR=$(dirname "$TARGET_PATH")
INCOMING_PATH="$REMOTE_TMP/$REMOTE_DB_TMP_NAME"
CONTAINER_WAS_RUNNING=0

sudo_run() {
  if [ -n "$SUDO_PASSWORD" ]; then
    printf '%s\n' "$SUDO_PASSWORD" | sudo -S -p '' "$@"
  else
    sudo "$@"
  fi
}

docker_run() {
  if docker info >/dev/null 2>&1; then
    docker "$@"
  else
    sudo_run docker "$@"
  fi
}

if [ -s "$TARGET_PATH" ] && [ "$OVERWRITE_DB" != "1" ]; then
  echo "Production DB already exists at $TARGET_PATH. Re-run with --overwrite-production-db to replace it after backup." >&2
  exit 3
fi

sudo_run mkdir -p "$TARGET_DIR"

if command -v docker >/dev/null 2>&1 || command -v sudo >/dev/null 2>&1; then
  if ! docker_run version >/dev/null 2>&1; then
    echo "Docker is required on the remote host before replacing the production SQLite DB." >&2
    exit 4
  fi

  if docker_run inspect "$APP_CONTAINER_NAME" >/dev/null 2>&1; then
    if [ "$(docker_run inspect -f '{{.State.Running}}' "$APP_CONTAINER_NAME")" = "true" ]; then
      CONTAINER_WAS_RUNNING=1
      docker_run stop "$APP_CONTAINER_NAME" >/dev/null
    fi
  else
    echo "App container $APP_CONTAINER_NAME is not present; continuing with offline DB install." >&2
  fi
else
  echo "Docker is required on the remote host before replacing the production SQLite DB." >&2
  exit 4
fi

if [ -s "$TARGET_PATH" ]; then
  sudo_run sqlite3 "$TARGET_PATH" ".backup '${TARGET_PATH}.backup-$STAMP'"
fi

sudo_run rm -f "$TARGET_PATH" "${TARGET_PATH}-wal" "${TARGET_PATH}-shm"
sudo_run install -D -m 0600 -o "$REMOTE_APP_UID" -g "$REMOTE_APP_GID" "$INCOMING_PATH" "$TARGET_PATH"

sudo_run sqlite3 "$TARGET_PATH" 'pragma integrity_check;' | grep -qx 'ok'

if [ "$CONTAINER_WAS_RUNNING" = "1" ]; then
  docker_run start "$APP_CONTAINER_NAME" >/dev/null
fi
REMOTE_DB
fi

if [ "$SYNC_UPLOADS" -eq 1 ] && [ -f "$TMP_DIR/uploads.tar.gz" ]; then
  "${SCP_BASE[@]}" "$TMP_DIR/uploads.tar.gz" "$REMOTE:$REMOTE_TMP/uploads.tar.gz" >/dev/null
  echo "[deploy-sync] Installing uploads into $REMOTE_UPLOADS_PATH"
  "${SSH_BASE[@]}" "$REMOTE" sh -s -- "$REMOTE_TMP" "$REPLACE_UPLOADS" "$REMOTE_UPLOADS_PATH" "$REMOTE_APP_UID" "$REMOTE_APP_GID" "${DEPLOY_USER_PASSWORD:-}" <<'REMOTE_UPLOADS'
set -eu
REMOTE_TMP=$1
REPLACE_UPLOADS=$2
TARGET_UPLOADS_PATH=$3
REMOTE_APP_UID=$4
REMOTE_APP_GID=$5
SUDO_PASSWORD=$6

sudo_run() {
  if [ -n "$SUDO_PASSWORD" ]; then
    printf '%s\n' "$SUDO_PASSWORD" | sudo -S -p '' "$@"
  else
    sudo "$@"
  fi
}

sudo_run mkdir -p "$TARGET_UPLOADS_PATH"
if [ "$REPLACE_UPLOADS" = "1" ]; then
  sudo_run find "$TARGET_UPLOADS_PATH" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
fi
sudo_run tar -xzf "$REMOTE_TMP/uploads.tar.gz" -C "$TARGET_UPLOADS_PATH"
sudo_run chown -R "$REMOTE_APP_UID:$REMOTE_APP_GID" "$TARGET_UPLOADS_PATH"
REMOTE_UPLOADS
elif [ "$SYNC_UPLOADS" -eq 1 ]; then
  echo "[deploy-sync] Uploads directory not found, skipped: $UPLOADS_SOURCE"
fi

"${SSH_BASE[@]}" "$REMOTE" "rm -rf '$REMOTE_TMP'" || true

echo "[deploy-sync] Done. Local project data is staged in the production shared runtime data."
echo "[deploy-sync] Next: npm run deploy"
