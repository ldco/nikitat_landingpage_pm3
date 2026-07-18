#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
DEPLOY_KNOWN_HOSTS_FILE=''

# shellcheck source=./lib/deploy-env.sh
source "$ROOT_DIR/scripts/lib/deploy-env.sh"

[[ -f "$ENV_FILE" ]] || { echo "[deploy-shell] .env is missing." >&2; exit 1; }
load_dotenv_file "$ENV_FILE"

DEPLOY_AUTH_MODE="$(resolved_deploy_auth_mode)"
validate_deploy_auth_mode || exit 1
validate_deploy_user || exit 1
REMOTE="$(resolved_deploy_user)@$SERVER_IP"
APP_CONTAINER="$(resolved_app_container_name)"
REMOTE_CMD='docker exec -it '"$(printf '%q' "$APP_CONTAINER")"' sh'
DEPLOY_KNOWN_HOSTS_FILE="$(resolved_deploy_known_hosts_file "$ROOT_DIR")"

command -v ssh-keyscan >/dev/null 2>&1 || { echo "[deploy-shell] Missing required command: ssh-keyscan" >&2; exit 1; }
command -v ssh-keygen >/dev/null 2>&1 || { echo "[deploy-shell] Missing required command: ssh-keygen" >&2; exit 1; }
bootstrap_known_host_entry "$ROOT_DIR" "$SERVER_IP" || { echo "[deploy-shell] Host trust bootstrap failed. Check SSH reachability." >&2; exit 1; }

if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
  DEPLOY_SSH_KEY="$(expand_tilde_path "${DEPLOY_SSH_KEY:-}")"
  exec ssh -t -i "$DEPLOY_SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE" "$REMOTE" "$REMOTE_CMD"
fi

command -v sshpass >/dev/null 2>&1 || { echo "[deploy-shell] Missing required command: sshpass" >&2; exit 1; }
exec sshpass -p "$DEPLOY_USER_PASSWORD" ssh -t -o PreferredAuthentications=password -o PubkeyAuthentication=no -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE" "$REMOTE" "$REMOTE_CMD"
