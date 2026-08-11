#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
ANSIBLE_INVENTORY_FILE="$ROOT_DIR/ansible/inventory.yml"
ANSIBLE_DEPLOY_VARS_FILE="$ROOT_DIR/ansible/deploy-vars.yml"
DEPLOY_KNOWN_HOSTS_FILE=''
SSH_REGISTRY_TUNNEL_PID=''
SSH_REGISTRY_LOCAL_PORT=''
DEPLOY_BUILD_TIMESTAMP=''
DEPLOY_BUILD_SHA=''
DEPLOY_BUILD_BRANCH=''
DEPLOY_BUILD_COMMIT_MESSAGE=''
RESUME_SETUP='false'
SETUP_CURRENT_STAGE='setup_started'
SETUP_TOUCHED_PRODUCTION='false'
SETUP_DEPLOY_ACCESS_VERIFIED='false'
SETUP_BOOTSTRAP_COMPLETED='false'
SETUP_STATE_FINALIZED='false'

# shellcheck source=./lib/deploy-env.sh
source "$ROOT_DIR/scripts/lib/deploy-env.sh"

log() {
  printf '[setup] %s\n' "$*"
}

fail() {
  printf '[setup] ERROR: %s\n' "$*" >&2
  if declare -F record_setup_failure >/dev/null 2>&1; then
    record_setup_failure "$*"
  fi
  exit 1
}

for arg in "$@"; do
  case "$arg" in
    --resume)
      RESUME_SETUP='true'
      ;;
    *)
      fail "Unknown setup argument: $arg"
      ;;
  esac
done

cleanup_ssh_registry_tunnel() {
  if [[ -n "${SSH_REGISTRY_TUNNEL_PID:-}" ]]; then
    kill "$SSH_REGISTRY_TUNNEL_PID" >/dev/null 2>&1 || true
    wait "$SSH_REGISTRY_TUNNEL_PID" >/dev/null 2>&1 || true
    SSH_REGISTRY_TUNNEL_PID=''
  fi
}

trap cleanup_ssh_registry_tunnel EXIT

print_health_failure_guidance() {
  local pid="${PROJECT_ID:-${SITE_DOMAIN//./-}}"
  printf '[setup] Health check failed after retries.\n' >&2
  printf '[setup] Inspect the containers with:\n' >&2
  printf '  npm run deploy:logs\n' >&2
  printf '  ssh %s@%s docker ps --filter name=pm-%s\n' "$DEPLOY_USER_NAME" "$SERVER_IP" "$pid" >&2
  printf '  ssh %s@%s docker logs pm-%s-app --tail 200\n' "$DEPLOY_USER_NAME" "$SERVER_IP" "$pid" >&2
  printf '  ssh %s@%s docker logs pm-traefik --tail 200\n' "$DEPLOY_USER_NAME" "$SERVER_IP" >&2
  printf '  curl -vk https://%s/api/health\n' "$SITE_DOMAIN" >&2
}

require_command() {
  local cmd="$1"
  local fix="$2"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    printf '[setup] Missing required command: %s\n' "$cmd" >&2
    printf '[setup] Install it, then re-run:\n  %s\n' "$fix" >&2
    exit 1
  fi
}

record_setup_state() {
  local status="$1"
  local reason="${2:-}"

  write_pm_deploy_state \
    "$ROOT_DIR" \
    "$SETUP_CURRENT_STAGE" \
    "$status" \
    "$reason" \
    "$SETUP_TOUCHED_PRODUCTION" \
    "${DEPLOY_USER_NAME:-}" \
    "${FINAL_DEPLOY_AUTH_MODE:-${DEPLOY_AUTH_MODE:-}}" \
    "$SETUP_DEPLOY_ACCESS_VERIFIED" \
    "$SETUP_BOOTSTRAP_COMPLETED" >/dev/null 2>&1 || true
}

record_setup_failure() {
  local reason="${1:-Setup failed.}"

  [[ "$SETUP_STATE_FINALIZED" == "true" ]] && return
  record_setup_state "failed" "$reason"
}

start_setup_stage() {
  SETUP_CURRENT_STAGE="$1"
  record_setup_state "running" "${2:-}"
  log "Starting stage: $1"
}

finish_setup_stage() {
  record_setup_state "completed" "${2:-}"
  log "Finished stage: $1"
}

trap 'record_setup_failure "Unexpected failure at setup line $LINENO."' ERR

upsert_env() {
  local key="$1"
  local value="$2"
  local tmp
  local rendered
  local line trimmed
  local updated=0

  rendered="$(format_env_assignment "$key" "$value")"
  tmp="$(mktemp)"

  if [[ -f "$ENV_FILE" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      trimmed="$(trim_whitespace "${line%$'\r'}")"
      if [[ "$trimmed" == "$key="* || "$trimmed" == "export $key="* ]]; then
        printf '%s\n' "$rendered" >>"$tmp"
        updated=1
      else
        printf '%s\n' "$line" >>"$tmp"
      fi
    done <"$ENV_FILE"
  fi

  if [[ $updated -eq 0 ]]; then
    printf '%s\n' "$rendered" >>"$tmp"
  fi

  mv "$tmp" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
}

persist_bootstrap_password_checkpoint() {
  upsert_env "DEPLOY_USER" "$DEPLOY_USER_NAME"
  upsert_env "DEPLOY_USER_PASSWORD" "$DEPLOY_USER_PASSWORD_CANDIDATE"
}

load_env() {
  # Env lifecycle split (three contracts, see scripts/lib/deploy-env.sh):
  #   - runtime app config — validated by src/lib/server/utils/env.ts (no soft
  #     dev fallbacks).
  #   - long-lived deploy secrets — generated ONLY during first-time bootstrap
  #     (no setup state file yet, or explicit PM_ENV_INIT=1).
  #   - steady state (setup state exists) — NEVER regenerate secrets; fail
  #     clearly when .env or the stable keys are missing/placeholder, so an
  #     existing deployment can never be silently orphaned.
  local state_file
  state_file="$(resolved_pm_deploy_state_file "$ROOT_DIR")"
  if env_bootstrap_allowed "$state_file"; then
    ensure_framework_env "$ENV_FILE" "$ROOT_DIR/.env.example"
  else
    validate_initialized_env "$ENV_FILE" || exit 1
  fi
  load_dotenv_file "$ENV_FILE"
}

# Interactive first-run collection of the operator site facts. Only runs on a
# real TTY; non-interactive runs skip prompting and the preflight below fails
# fast listing the exact missing keys.
collect_site_facts() {
  [[ -t 0 && -t 1 ]] || return 0
  local key prompt value input
  local pairs=(
    "SITE_DOMAIN:production site domain (e.g. example.com)"
    "SERVER_IP:server public IP address"
    "ACME_EMAIL:Let's Encrypt certificate email"
  )
  for pair in "${pairs[@]}"; do
    key="${pair%%:*}"
    prompt="${pair#*:}"
    value="${!key:-}"
    if is_placeholder_env_value "$key" "$value"; then
      printf '[setup] %s is not set. Enter %s: ' "$key" "$prompt"
      IFS= read -r input
      input="$(trim_whitespace "$input")"
      if [[ -n "$input" ]]; then
        printf -v "$key" '%s' "$input"
        export "$key=$input"
        upsert_env "$key" "$input"
        log "Stored $key in .env."
      fi
    fi
  done
}

build_deploy_ssh_base() {
  DEPLOY_SSH_BASE=(ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE")

  case "$DEPLOY_AUTH_MODE" in
    password)
      DEPLOY_SSH_BASE=(sshpass -p "$DEPLOY_USER_PASSWORD_CANDIDATE" ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE" -o PreferredAuthentications=password -o PubkeyAuthentication=no)
      ;;
    ssh_key)
      DEPLOY_SSH_BASE=(ssh -i "$DEPLOY_SSH_KEY" -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE")
      ;;
  esac
}

run_deploy_ssh() {
  "${DEPLOY_SSH_BASE[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$1"
}

can_connect_with_deploy_access() {
  run_deploy_ssh true >/dev/null 2>&1
}

can_become_with_deploy_password() {
  [[ -n "${DEPLOY_USER_PASSWORD_CANDIDATE:-}" ]] || return 1
  run_deploy_ssh "printf '%s\n' $(printf '%q' "$DEPLOY_USER_PASSWORD_CANDIDATE") | sudo -S -p '' true" >/dev/null 2>&1
}

can_recover_with_root_password() {
  ! is_placeholder_env_value "SERVER_ROOT_PASSWORD" "${SERVER_ROOT_PASSWORD:-}"
}

bootstrap_ssh_access() {
  validate_required_env_value "SERVER_ROOT_PASSWORD" "${SERVER_ROOT_PASSWORD:-}" || exit 1
  require_command "sshpass" "sudo apt-get update && sudo apt-get install -y sshpass"

  log "Bootstrapping deploy user access on $SERVER_IP using the provider root password."
  sshpass -p "$SERVER_ROOT_PASSWORD" ssh \
    -o StrictHostKeyChecking=yes \
    -o UserKnownHostsFile="$DEPLOY_KNOWN_HOSTS_FILE" \
    -o PreferredAuthentications=password \
    -o PubkeyAuthentication=no \
    "root@$SERVER_IP" \
    "DEPLOY_USER_NAME=$(printf '%q' "$DEPLOY_USER_NAME") DEPLOY_USER_PASSWORD=$(printf '%q' "$DEPLOY_USER_PASSWORD_CANDIDATE") DEPLOY_PUBLIC_KEY_B64=$(printf '%q' "${PUBLIC_KEY_B64:-}") bash -s" <<'EOF'
set -euo pipefail

if ! id -u "$DEPLOY_USER_NAME" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER_NAME"
fi

usermod -aG sudo "$DEPLOY_USER_NAME"
printf '%s:%s\n' "$DEPLOY_USER_NAME" "$DEPLOY_USER_PASSWORD" | chpasswd

if [ -n "$DEPLOY_PUBLIC_KEY_B64" ]; then
  install -d -m 700 -o "$DEPLOY_USER_NAME" -g "$DEPLOY_USER_NAME" "/home/$DEPLOY_USER_NAME/.ssh"
  touch "/home/$DEPLOY_USER_NAME/.ssh/authorized_keys"
  chown "$DEPLOY_USER_NAME:$DEPLOY_USER_NAME" "/home/$DEPLOY_USER_NAME/.ssh/authorized_keys"
  chmod 600 "/home/$DEPLOY_USER_NAME/.ssh/authorized_keys"

  decoded_key="$(printf '%s' "$DEPLOY_PUBLIC_KEY_B64" | base64 -d)"
  if ! grep -qxF "$decoded_key" "/home/$DEPLOY_USER_NAME/.ssh/authorized_keys"; then
    printf '%s\n' "$decoded_key" >>"/home/$DEPLOY_USER_NAME/.ssh/authorized_keys"
  fi
fi
EOF

  persist_bootstrap_password_checkpoint
}

persist_verified_access() {
  local final_auth_mode="${1:-$DEPLOY_AUTH_MODE}"

  upsert_env "SSH_KEY" "$([[ "$final_auth_mode" == "ssh_key" ]] && printf true || printf false)"
  upsert_env "PM_DEPLOY_AUTH_MODE" "$final_auth_mode"
  upsert_env "DEPLOY_USER" "$DEPLOY_USER_NAME"
  upsert_env "DEPLOY_USER_PASSWORD" "$DEPLOY_USER_PASSWORD_CANDIDATE"

  if [[ "$final_auth_mode" == "ssh_key" ]]; then
    upsert_env "DEPLOY_SSH_KEY" "$DEPLOY_SSH_KEY_ENV"
  else
    upsert_env "DEPLOY_SSH_KEY" ""
  fi
}

render_ansible_artifacts() {
  local connection_auth_mode="${1:-$DEPLOY_AUTH_MODE}"
  local steady_state_auth_mode="${2:-$DEPLOY_AUTH_MODE}"

  log "Generating ansible/inventory.yml from .env."
  render_ansible_inventory_file \
    "$ANSIBLE_INVENTORY_FILE" \
    "$SERVER_IP" \
    "$connection_auth_mode" \
    "$DEPLOY_USER_PASSWORD_CANDIDATE" \
    "${DEPLOY_SSH_KEY:-}" \
    "${DEPLOY_SSH_KEY_PUB:-}" \
    "$DEPLOY_KNOWN_HOSTS_FILE"

  log "Generating ansible/deploy-vars.yml from .env."
  render_ansible_deploy_vars_file "$ANSIBLE_DEPLOY_VARS_FILE" "$steady_state_auth_mode"
}

run_ansible_as_deploy() {
  local runtime_vars_file
  local exit_code=0
  runtime_vars_file="$(mktemp)"
  render_ansible_runtime_vars_file "$runtime_vars_file" "$DEPLOY_USER_PASSWORD_CANDIDATE"

  log "Provisioning the server with Ansible."
  (cd "$ROOT_DIR" && ansible-playbook -i ansible/inventory.yml --extra-vars "@$runtime_vars_file" ansible/provision-shared.yml) || exit_code=$?
  rm -f "$runtime_vars_file"
  return "$exit_code"
}

run_ansible_app_deploy() {
  local runtime_vars_file
  local build_vars_file
  local exit_code=0
  runtime_vars_file="$(mktemp)"
  build_vars_file="$(mktemp)"
  render_ansible_runtime_vars_file "$runtime_vars_file" "$DEPLOY_USER_PASSWORD_CANDIDATE"
  {
    printf 'deploy_version: %s\n' "$(quote_yaml_value "$DEPLOY_VERSION")"
    printf 'build_timestamp: %s\n' "$(quote_yaml_value "$DEPLOY_BUILD_TIMESTAMP")"
    printf 'build_sha: %s\n' "$(quote_yaml_value "$DEPLOY_BUILD_SHA")"
    printf 'build_branch: %s\n' "$(quote_yaml_value "$DEPLOY_BUILD_BRANCH")"
    printf 'build_commit_message: %s\n' "$(quote_yaml_value "$DEPLOY_BUILD_COMMIT_MESSAGE")"
  } >"$build_vars_file"
  {
    printf 'project_id: %s\n' "$(quote_yaml_value "${SITE_DOMAIN//./-}")"
    printf 'project_domain: %s\n' "$(quote_yaml_value "${SITE_DOMAIN:-}")"
    printf 'app_image_ref: %s\n' "$(quote_yaml_value "$(resolved_ansible_app_image_ref)")"
  } >>"$build_vars_file"

  log "Deploying Traefik and the application container via Ansible."
  (cd "$ROOT_DIR" && ansible-playbook -i ansible/inventory.yml --extra-vars "@$runtime_vars_file" --extra-vars "@$build_vars_file" ansible/deploy.yml) || exit_code=$?
  rm -f "$runtime_vars_file" "$build_vars_file"
  return "$exit_code"
}

run_ansible_app_deploy_with_retries() {
  local max_attempts="${PM_DEPLOY_ANSIBLE_RETRIES:-3}"
  local retry_delay="${PM_DEPLOY_ANSIBLE_RETRY_DELAY_SECONDS:-5}"
  local attempt=1

  if ! [[ "$max_attempts" =~ ^[1-9][0-9]*$ ]]; then
    fail "PM_DEPLOY_ANSIBLE_RETRIES must be a positive integer."
  fi

  if ! [[ "$retry_delay" =~ ^[0-9]+$ ]]; then
    fail "PM_DEPLOY_ANSIBLE_RETRY_DELAY_SECONDS must be a non-negative integer."
  fi

  while (( attempt <= max_attempts )); do
    if run_ansible_app_deploy; then
      return 0
    fi

    if (( attempt == max_attempts )); then
      return 1
    fi

    log "Ansible app rollout attempt $attempt failed. Retrying in ${retry_delay}s."
    sleep "$retry_delay"
    attempt=$((attempt + 1))
  done

  return 1
}

source "$ROOT_DIR/scripts/lib/deploy-registry.sh"

remote_shared_data_state() {
  run_deploy_ssh "set -euo pipefail
shared_root=\$(printf '%q' \"/home/$DEPLOY_USER_NAME/app/shared/$PROJECT_ID\")
db_path=\"\$shared_root/data/$(printf '%s' "$(resolved_database_relative_path)")\"
uploads_path=\"\$shared_root/uploads\"

if [ -s \"\$db_path\" ]; then
  echo db=present
else
  echo db=empty
fi

if [ -d \"\$uploads_path\" ] && find \"\$uploads_path\" -mindepth 1 -maxdepth 1 -print -quit | grep -q .; then
  echo uploads=present
else
  echo uploads=empty
fi"
}

auto_sync_local_data_on_first_setup() {
  local remote_state db_state uploads_state local_db_present local_uploads_present
  local sync_args=()

  local_db_present=0
  local_uploads_present=0
  [[ -f "$ROOT_DIR/data/sqlite.db" ]] && local_db_present=1
  [[ -d "$ROOT_DIR/public/uploads" ]] && find "$ROOT_DIR/public/uploads" -mindepth 1 -maxdepth 1 -print -quit | grep -q . && local_uploads_present=1

  remote_state="$(remote_shared_data_state)"
  db_state="$(printf '%s\n' "$remote_state" | awk -F= '/^db=/{print $2}')"
  uploads_state="$(printf '%s\n' "$remote_state" | awk -F= '/^uploads=/{print $2}')"

  if [[ "$db_state" != "empty" && "$uploads_state" != "empty" ]]; then
    log "Production shared data already exists. Skipping automatic local data promotion."
    return
  fi

  if [[ "$db_state" == "empty" && $local_db_present -eq 1 ]]; then
    :
  else
    sync_args+=(--skip-db)
  fi

  if [[ "$uploads_state" == "empty" && $local_uploads_present -eq 1 ]]; then
    :
  else
    sync_args+=(--skip-uploads)
  fi

  if [[ "${#sync_args[@]}" -eq 2 ]]; then
    log "No local project data is available for automatic first-setup promotion. Skipping data sync."
    return
  fi

  log "Production shared data is empty. Promoting local project data during first setup."
  PM_LOCAL_ENV="$ENV_FILE" bash "$ROOT_DIR/scripts/deploy-sync-local-data.sh" --yes "${sync_args[@]}"
}

verify_deploy_access() {
  can_connect_with_deploy_access || fail "Deploy access is not available after bootstrap."
  can_become_with_deploy_password || fail "Deploy sudo access is not available after bootstrap."
}

transition_to_key_auth() {
  log "Verifying deploy SSH key access before disabling password login."
  DEPLOY_AUTH_MODE="ssh_key"
  build_deploy_ssh_base
  verify_deploy_access

  persist_verified_access "ssh_key"
  render_ansible_artifacts "ssh_key" "ssh_key"

  log "Re-running provisioning with SSH key auth to enforce steady-state SSH hardening."
  run_ansible_as_deploy
}

ensure_deploy_access() {
  if can_connect_with_deploy_access; then
    log "Deploy access already works with DEPLOY_USER=$DEPLOY_USER_NAME and PM_DEPLOY_AUTH_MODE=$DEPLOY_AUTH_MODE."
  else
    bootstrap_ssh_access
    build_deploy_ssh_base
    verify_deploy_access
  fi

  if can_become_with_deploy_password; then
    log "Deploy sudo access is available with the verified deploy password."
    return
  fi

  if can_recover_with_root_password; then
    log "Deploy access exists but sudo password verification failed. Resetting the remote deploy password."
    bootstrap_ssh_access
    build_deploy_ssh_base
    verify_deploy_access
    return
  fi

  fail "Deploy access exists but DEPLOY_USER_PASSWORD is stale, and SERVER_ROOT_PASSWORD recovery is not configured. Restore the real deploy password or provide a valid root password, then rerun setup."
}

# Framework-level env contract: first-time runs bootstrap .env and
# auto-generate the framework-managed secrets (load_env → env_bootstrap_allowed);
# steady-state runs validate the existing secrets instead of regenerating.
# Only site facts cannot be generated: SITE_DOMAIN, SERVER_IP, ACME_EMAIL.
log "Resolving the framework env contract (.env bootstrap or steady-state validation)."
require_command "openssl" "sudo apt-get update && sudo apt-get install -y openssl"
load_env
collect_site_facts

DATA_VOLUME="${PM_DEPLOY_DATA_VOLUME:-pm_data}"
BOOTSTRAP_AUTH_MODE="$(resolved_deploy_auth_mode)"
FINAL_DEPLOY_AUTH_MODE="$BOOTSTRAP_AUTH_MODE"
DEPLOY_AUTH_MODE="$BOOTSTRAP_AUTH_MODE"
DEPLOY_USER_NAME="$(resolved_deploy_user)"

validate_required_env_values \
  SITE_DOMAIN \
  SERVER_IP \
  ACME_EMAIL || exit 1
validate_site_domains || exit 1
normalize_site_domain_env
PROJECT_ID="${SITE_DOMAIN//./-}"
validate_deploy_auth_mode || exit 1
validate_deploy_user || exit 1
validate_pm_settings_encryption_key || fail "PM_SETTINGS_ENCRYPTION_KEY or SETTINGS_ENCRYPTION_KEY must be a real 64+ character hexadecimal secret before setup."
normalize_settings_encryption_key
# TOTP_ENCRYPTION_KEY is required at runtime when FEATURES.twoFactorAuth is
# enabled (src/hooks.server.ts fail-fast). ensure_framework_env generates it,
# so requiring it here catches misconfiguration BEFORE the container crash-loops.
validate_pm_totp_encryption_key || fail "TOTP_ENCRYPTION_KEY must be a real 64+ character hexadecimal secret before setup (required when FEATURES.twoFactorAuth is enabled)."
normalize_totp_encryption_key
validate_deploy_database_url || fail "PM_DEPLOY_DATABASE_URL must be inside /app/data for setup schema sync."

require_command "ansible-playbook" "Arch: sudo pacman -S --needed ansible | Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y ansible"
require_command "ansible-galaxy" "Arch: sudo pacman -S --needed ansible | Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y ansible"
require_command "docker" "Install Docker Desktop or Docker Engine on the deploy machine."
require_command "ssh" "sudo apt-get update && sudo apt-get install -y openssh-client"
require_command "ssh-keyscan" "sudo apt-get update && sudo apt-get install -y openssh-client"
require_command "openssl" "sudo apt-get update && sudo apt-get install -y openssl"
require_command "curl" "sudo apt-get update && sudo apt-get install -y curl"
require_command "git" "sudo apt-get update && sudo apt-get install -y git"
require_command "node" "Install Node.js on the setup machine."
if [[ "$(resolved_docker_deploy_mode)" == "local" ]]; then
  require_command "zstd" "Arch: sudo pacman -S --needed zstd | Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y zstd"
fi

KEY_BASENAME="pm_deploy_${SITE_DOMAIN}"
DEPLOY_SSH_KEY_ENV="${DEPLOY_SSH_KEY:-~/.ssh/$KEY_BASENAME}"
DEPLOY_KNOWN_HOSTS_FILE="$(resolved_deploy_known_hosts_file "$ROOT_DIR")"
DEPLOY_VERSION="${DEPLOY_VERSION:-$(default_deploy_version "$ROOT_DIR")}"
DEPLOY_BUILD_TIMESTAMP="${BUILD_TIMESTAMP:-$(default_build_timestamp)}"
DEPLOY_BUILD_SHA="${BUILD_SHA:-$(resolved_build_sha "$ROOT_DIR")}"
DEPLOY_BUILD_BRANCH="${BUILD_BRANCH:-$(resolved_build_branch "$ROOT_DIR")}"
DEPLOY_BUILD_COMMIT_MESSAGE="${BUILD_COMMIT_MESSAGE:-$(resolved_build_commit_message "$ROOT_DIR")}"
validate_docker_deploy_contract || fail "Docker registry/image settings are invalid."
if [[ -z "${DEPLOY_USER_PASSWORD:-}" ]]; then
  DEPLOY_USER_PASSWORD_CANDIDATE="$(openssl rand -base64 24)"
  log "Generated a candidate DEPLOY_USER_PASSWORD."
else
  DEPLOY_USER_PASSWORD_CANDIDATE="$DEPLOY_USER_PASSWORD"
  log "Using existing DEPLOY_USER_PASSWORD from .env."
fi
DEPLOY_USER="$DEPLOY_USER_NAME"
DEPLOY_USER_PASSWORD="$DEPLOY_USER_PASSWORD_CANDIDATE"
export DEPLOY_USER DEPLOY_USER_PASSWORD

if [[ "$RESUME_SETUP" == "true" ]]; then
  log "Resuming setup from the current .env and local setup state."
fi

start_setup_stage "setup_started" "Setup initialized."

if [[ "$BOOTSTRAP_AUTH_MODE" == "password" ]]; then
  log "Password SSH requested. Setup will keep deploy password auth for steady-state access."
  require_command "sshpass" "sudo apt-get update && sudo apt-get install -y sshpass"
fi

if [[ "$FINAL_DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
  require_command "ssh-keygen" "sudo apt-get update && sudo apt-get install -y openssh-client"

  DEPLOY_SSH_KEY="$(expand_tilde_path "$DEPLOY_SSH_KEY_ENV")"
  DEPLOY_SSH_KEY_PUB="${DEPLOY_SSH_KEY}.pub"

  if [[ ! -f "$DEPLOY_SSH_KEY" ]]; then
    mkdir -p "$(dirname "$DEPLOY_SSH_KEY")"
    ssh-keygen -t ed25519 -C "pm-deploy@$SITE_DOMAIN" -N "" -f "$DEPLOY_SSH_KEY" >/dev/null
    log "Generated SSH keypair at $DEPLOY_SSH_KEY."
  else
    log "Reusing existing SSH keypair at $DEPLOY_SSH_KEY."
  fi

  PUBLIC_KEY_B64="$(base64 <"$DEPLOY_SSH_KEY_PUB" | tr -d '\n')"
else
  DEPLOY_SSH_KEY=''
  DEPLOY_SSH_KEY_PUB=''
  DEPLOY_SSH_KEY_ENV=''
  PUBLIC_KEY_B64=''
fi

start_setup_stage "host_trust_and_ansible_setup"
bootstrap_known_host_entry "$ROOT_DIR" "$SERVER_IP" || fail "Host trust bootstrap failed. Check SSH reachability, then rerun setup."
install_ansible_collections "$ROOT_DIR" "setup"
finish_setup_stage "host_trust_and_ansible_setup"

start_setup_stage "deploy_access_bootstrap"
SETUP_TOUCHED_PRODUCTION='true'
build_deploy_ssh_base
render_ansible_artifacts "$BOOTSTRAP_AUTH_MODE" "$FINAL_DEPLOY_AUTH_MODE"
ensure_deploy_access
SETUP_DEPLOY_ACCESS_VERIFIED='true'
SETUP_BOOTSTRAP_COMPLETED='true'
finish_setup_stage "deploy_access_bootstrap"

start_setup_stage "server_provisioning"
run_ansible_as_deploy
finish_setup_stage "server_provisioning"

start_setup_stage "steady_state_deploy_access"
if [[ "$FINAL_DEPLOY_AUTH_MODE" == "ssh_key" && "$BOOTSTRAP_AUTH_MODE" == "password" ]]; then
  transition_to_key_auth
else
  persist_verified_access "$FINAL_DEPLOY_AUTH_MODE"
  render_ansible_artifacts "$FINAL_DEPLOY_AUTH_MODE" "$FINAL_DEPLOY_AUTH_MODE"
fi
finish_setup_stage "steady_state_deploy_access"

start_setup_stage "remote_registry_preparation"
ensure_remote_ssh_registry
finish_setup_stage "remote_registry_preparation"

start_setup_stage "docker_build"
build_and_push_docker_image "$ROOT_DIR" "setup"
finish_setup_stage "docker_build"

if [[ "$(resolved_docker_deploy_mode)" == "ssh-registry" ]]; then
  start_setup_stage "ssh_registry_image_push"
  start_ssh_registry_tunnel
  push_docker_image_to_ssh_registry
  log "Closing SSH registry tunnel before first-setup data sync and Ansible rollout."
  cleanup_ssh_registry_tunnel
  finish_setup_stage "ssh_registry_image_push"
fi

start_setup_stage "first_setup_data_sync"
auto_sync_local_data_on_first_setup
finish_setup_stage "first_setup_data_sync"

start_setup_stage "runtime_image_preparation"
ensure_remote_traefik_image
finish_setup_stage "runtime_image_preparation"

start_setup_stage "ansible_app_rollout"
if ! run_ansible_app_deploy_with_retries; then
  fail "Ansible app rollout failed after the setup image push."
fi
finish_setup_stage "ansible_app_rollout"

start_setup_stage "traefik_config_generation"
log "Regenerating Traefik routing config for all deployed projects."
export DEPLOY_SSH_KEY DEPLOY_USER_PASSWORD DEPLOY_USER_NAME DEPLOY_KNOWN_HOSTS_FILE
bash "$ROOT_DIR/scripts/pm-traefik-config.sh"
finish_setup_stage "traefik_config_generation"

start_setup_stage "public_health_check"
log "Running production health check with retries."
if ! health_check_with_retries "setup" "https://$SITE_DOMAIN/api/health"; then
  print_health_failure_guidance
  fail "Health check failed after setup."
fi
finish_setup_stage "public_health_check"

SETUP_CURRENT_STAGE='setup_complete'
SETUP_STATE_FINALIZED='true'
record_setup_state "completed" "Setup completed."

log "Setup complete."
log "Future deploys are just: npm run deploy"
log "Deploy user password location: .env (DEPLOY_USER_PASSWORD)"
