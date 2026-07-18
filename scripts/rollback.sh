#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
ANSIBLE_INVENTORY_FILE="$ROOT_DIR/ansible/inventory.yml"
ANSIBLE_DEPLOY_VARS_FILE="$ROOT_DIR/ansible/deploy-vars.yml"
DEPLOY_KNOWN_HOSTS_FILE=''

# shellcheck source=./lib/deploy-env.sh
source "$ROOT_DIR/scripts/lib/deploy-env.sh"

log() {
  printf '[rollback] %s\n' "$*"
}

fail() {
  printf '[rollback] ERROR: %s\n' "$*" >&2
  exit 1
}

print_health_failure_guidance() {
  local pid="${PROJECT_ID:-${SITE_DOMAIN//./-}}"
  printf '[rollback] Health check failed after retries.\n' >&2
  printf '[rollback] Inspect the containers with:\n' >&2
  printf '  npm run deploy:logs\n' >&2
  printf '  ssh %s@%s docker ps --filter name=pm-%s\n' "$DEPLOY_USER" "$SERVER_IP" "$pid" >&2
  printf '  ssh %s@%s docker logs pm-%s-app --tail 200\n' "$DEPLOY_USER" "$SERVER_IP" "$pid" >&2
  printf '  ssh %s@%s docker logs pm-traefik --tail 200\n' "$DEPLOY_USER" "$SERVER_IP" >&2
  printf '  curl -vk https://%s/api/health\n' "$SITE_DOMAIN" >&2
}

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "Missing required command: $cmd"
  fi
}

[[ -f "$ENV_FILE" ]] || fail ".env is missing."
load_dotenv_file "$ENV_FILE"

require_command ansible-playbook
require_command ansible-galaxy
require_command ssh-keyscan
require_command ssh-keygen
require_command curl

DEPLOY_AUTH_MODE="$(resolved_deploy_auth_mode)"
DEPLOY_USER="$(resolved_deploy_user)"
validate_deploy_auth_mode || exit 1
validate_deploy_user || exit 1
validate_required_env_values SITE_DOMAIN SERVER_IP DEPLOY_USER_PASSWORD || exit 1
validate_site_domains || exit 1
normalize_site_domain_env

PROJECT_ID="${SITE_DOMAIN//./-}"

if [[ "${PM_DEPLOY_SCHEMA_MODE:-compatible}" == "maintenance" && "${PM_DEPLOY_FORCE_APP_ROLLBACK:-0}" != "1" ]]; then
  fail "PM_DEPLOY_SCHEMA_MODE=maintenance requires database recovery planning. Set PM_DEPLOY_FORCE_APP_ROLLBACK=1 only if you intentionally want runtime rollback without DB restore."
fi

if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
  DEPLOY_SSH_KEY="$(expand_tilde_path "${DEPLOY_SSH_KEY:-}")"
  DEPLOY_SSH_KEY_PUB="${DEPLOY_SSH_KEY}.pub"
  validate_required_env_value "DEPLOY_SSH_KEY" "${DEPLOY_SSH_KEY:-}" || exit 1
  [[ -f "$DEPLOY_SSH_KEY" ]] || fail "DEPLOY_SSH_KEY does not exist: $DEPLOY_SSH_KEY"
else
  require_command sshpass
  DEPLOY_SSH_KEY=''
  DEPLOY_SSH_KEY_PUB=''
fi

DEPLOY_KNOWN_HOSTS_FILE="$(resolved_deploy_known_hosts_file "$ROOT_DIR")"
bootstrap_known_host_entry "$ROOT_DIR" "$SERVER_IP" || fail "Host trust bootstrap failed. Check SSH reachability, then rerun rollback."
install_ansible_collections "$ROOT_DIR" "rollback"

render_ansible_inventory_file \
  "$ANSIBLE_INVENTORY_FILE" \
  "$SERVER_IP" \
  "$DEPLOY_AUTH_MODE" \
  "$DEPLOY_USER_PASSWORD" \
  "${DEPLOY_SSH_KEY:-}" \
  "${DEPLOY_SSH_KEY_PUB:-}" \
  "$DEPLOY_KNOWN_HOSTS_FILE"
render_ansible_deploy_vars_file "$ANSIBLE_DEPLOY_VARS_FILE"

RUNTIME_VARS_FILE="$(mktemp)"
BUILD_VARS_FILE="$(mktemp)"
render_ansible_runtime_vars_file "$RUNTIME_VARS_FILE" "$DEPLOY_USER_PASSWORD"
{
  printf 'project_id: %s\n' "$(quote_yaml_value "$PROJECT_ID")"
} >"$BUILD_VARS_FILE"

log "Rolling back project '$PROJECT_ID' to previously recorded image."
if ! (cd "$ROOT_DIR" && ansible-playbook \
    -i ansible/inventory.yml \
    --extra-vars "@$RUNTIME_VARS_FILE" \
    --extra-vars "@$BUILD_VARS_FILE" \
    ansible/rollback-app.yml); then
  rm -f "$RUNTIME_VARS_FILE" "$BUILD_VARS_FILE"
  fail "Ansible rollback failed."
fi
rm -f "$RUNTIME_VARS_FILE" "$BUILD_VARS_FILE"

log "Running post-rollback health check with retries."
if ! health_check_with_retries "rollback" "https://$SITE_DOMAIN/api/health"; then
  print_health_failure_guidance
  fail "Health check failed after rollback."
fi

log "Rollback complete."
