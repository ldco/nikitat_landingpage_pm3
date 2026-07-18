#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
ANSIBLE_INVENTORY_FILE="$ROOT_DIR/ansible/inventory.yml"
ANSIBLE_DEPLOY_VARS_FILE="$ROOT_DIR/ansible/deploy-vars.yml"
DEPLOY_KNOWN_HOSTS_FILE=''
LOCAL_DOCKER_IMAGE_ARCHIVE=''
LOCAL_DOCKER_IMAGE_PRELOADED='false'
SSH_REGISTRY_TUNNEL_PID=''
SSH_REGISTRY_LOCAL_PORT=''
DEPLOY_STARTED_AT=0
DEPLOY_STAGE_STARTED_AT=0
DEPLOY_BUILD_TIMESTAMP=''
DEPLOY_BUILD_SHA=''
DEPLOY_BUILD_BRANCH=''
DEPLOY_BUILD_COMMIT_MESSAGE=''

# shellcheck source=./lib/deploy-env.sh
source "$ROOT_DIR/scripts/lib/deploy-env.sh"

log() {
  printf '[deploy] %s\n' "$*"
}

elapsed_seconds() {
  local started_at="$1"
  local now

  now="$(date +%s)"
  printf '%s' "$((now - started_at))"
}

start_deploy_stage() {
  DEPLOY_STAGE_STARTED_AT="$(date +%s)"
  log "Starting stage: $*"
}

finish_deploy_stage() {
  log "Finished stage: $* (${DEPLOY_STAGE_STARTED_AT:+$(elapsed_seconds "$DEPLOY_STAGE_STARTED_AT")s})"
}

fail() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

print_health_failure_guidance() {
  local pid="${PROJECT_ID:-${SITE_DOMAIN//./-}}"
  printf '[deploy] Health check failed after retries.\n' >&2
  printf '[deploy] Inspect the containers with:\n' >&2
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
    printf '[deploy] Missing required command: %s\n' "$cmd" >&2
    printf '[deploy] Install it, then re-run:\n  %s\n' "$fix" >&2
    exit 1
  fi
}

load_env() {
  [[ -f "$ENV_FILE" ]] || fail ".env is missing."
  load_dotenv_file "$ENV_FILE"
}

render_ansible_artifacts() {
  render_ansible_inventory_file \
    "$ANSIBLE_INVENTORY_FILE" \
    "$SERVER_IP" \
    "$DEPLOY_AUTH_MODE" \
    "$DEPLOY_USER_PASSWORD" \
    "${DEPLOY_SSH_KEY:-}" \
    "${DEPLOY_SSH_KEY_PUB:-}" \
    "$DEPLOY_KNOWN_HOSTS_FILE"
  render_ansible_deploy_vars_file "$ANSIBLE_DEPLOY_VARS_FILE"
}

cleanup_ssh_registry_tunnel() {
  if [[ -n "${SSH_REGISTRY_TUNNEL_PID:-}" ]]; then
    kill "$SSH_REGISTRY_TUNNEL_PID" >/dev/null 2>&1 || true
    wait "$SSH_REGISTRY_TUNNEL_PID" >/dev/null 2>&1 || true
    SSH_REGISTRY_TUNNEL_PID=''
  fi
}

trap cleanup_ssh_registry_tunnel EXIT

ensure_remote_zstd() {
  local runtime_vars_file
  local playbook_file
  local exit_code=0

  [[ "$(resolved_docker_deploy_mode)" == "local" ]] || return 0

  require_command "zstd" "Arch: sudo pacman -S --needed zstd | Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y zstd"

  runtime_vars_file="$(mktemp)"
  playbook_file="$(mktemp)"
  render_ansible_runtime_vars_file "$runtime_vars_file" "$DEPLOY_USER_PASSWORD"

  cat >"$playbook_file" <<'EOF'
- name: Ensure zstd is available for local Docker image streaming
  hosts: all
  become: true
  gather_facts: false
  tasks:
    - name: Install zstd
      apt:
        name: zstd
        state: present
        update_cache: true
        cache_valid_time: 3600

    - name: Verify zstd command exists
      command: /usr/bin/env zstd --version
      changed_when: false
EOF

  log "Ensuring zstd is installed on the server for local image streaming."
  (cd "$ROOT_DIR" && ansible-playbook -i ansible/inventory.yml --extra-vars "@$runtime_vars_file" "$playbook_file") || exit_code=$?
  rm -f "$runtime_vars_file" "$playbook_file"
  return "$exit_code"
}

source "$ROOT_DIR/scripts/lib/deploy-registry.sh"

stream_docker_image_to_server() {
  local image_ref
  local compression
  local threads
  local remote_cmd
  local ssh_common_args
  local ssh_cmd

  image_ref="$(resolved_docker_image_ref)"
  compression="$(select_docker_stream_compression)"
  threads="$(local_cpu_count)"
  remote_cmd="$(docker_stream_remote_command "$compression")"
  ssh_common_args=(
    -o StrictHostKeyChecking=yes
    -o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS_FILE"
  )

  if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
    ssh_cmd=(ssh -i "$DEPLOY_SSH_KEY" "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$remote_cmd")
  else
    ssh_cmd=(sshpass -p "$DEPLOY_USER_PASSWORD" ssh "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$remote_cmd")
  fi

  log "Streaming Docker image $image_ref directly to the server using $compression compression."

  case "$compression" in
    zstd)
      docker save "$image_ref" | zstd -T0 -3 -c | "${ssh_cmd[@]}"
      ;;
    pigz)
      docker save "$image_ref" | pigz -c -p "$threads" | "${ssh_cmd[@]}"
      ;;
    gzip)
      docker save "$image_ref" | gzip -c | "${ssh_cmd[@]}"
      ;;
    *)
      fail "Unsupported Docker stream compression: $compression"
      ;;
  esac
}

local_cpu_count() {
  local count

  count="$(getconf _NPROCESSORS_ONLN 2>/dev/null || nproc 2>/dev/null || printf '1')"
  if [[ ! "$count" =~ ^[0-9]+$ ]] || (( count < 1 )); then
    count=1
  fi

  printf '%s' "$count"
}

remote_has_command() {
  local command_name="$1"
  local remote_cmd
  local ssh_common_args
  local ssh_cmd

  remote_cmd="command -v $command_name >/dev/null 2>&1"
  ssh_common_args=(
    -o StrictHostKeyChecking=yes
    -o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS_FILE"
  )

  if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
    ssh_cmd=(ssh -i "$DEPLOY_SSH_KEY" "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$remote_cmd")
  else
    ssh_cmd=(sshpass -p "$DEPLOY_USER_PASSWORD" ssh "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$remote_cmd")
  fi

  "${ssh_cmd[@]}" >/dev/null 2>&1
}

select_docker_stream_compression() {
  local requested="${PM_DOCKER_STREAM_COMPRESSION:-zstd}"

  case "$requested" in
    zstd)
      command -v zstd >/dev/null 2>&1 || fail "PM_DOCKER_STREAM_COMPRESSION=zstd requires zstd on the deploy machine."
      remote_has_command zstd || fail "PM_DOCKER_STREAM_COMPRESSION=zstd requires zstd on the server."
      printf 'zstd'
      ;;
    pigz)
      command -v pigz >/dev/null 2>&1 || fail "PM_DOCKER_STREAM_COMPRESSION=pigz requires pigz on the deploy machine."
      printf 'pigz'
      ;;
    gzip)
      printf 'gzip'
      ;;
    *)
      fail "PM_DOCKER_STREAM_COMPRESSION must be zstd, pigz, or gzip."
      ;;
  esac
}

docker_stream_remote_command() {
  local compression="$1"

  case "$compression" in
    zstd)
      printf 'zstd -dc | docker load'
      ;;
    pigz | gzip)
      printf 'gzip -dc | docker load'
      ;;
    *)
      fail "Unsupported Docker stream compression: $compression"
      ;;
  esac
}

print_recovery_guidance() {
  if [[ "$SCHEMA_MODE" == "maintenance" ]]; then
    printf '[deploy] Database schema changes may already be applied. Do not assume npm run rollback is safe.\n' >&2
    printf '[deploy] Keep the maintenance/read-only window active and use the database restore or manual recovery path.\n' >&2
    return
  fi

  printf '[deploy] If this release only used backward-compatible schema changes, image rollback may be safe:\n  npm run rollback\n' >&2
  printf '[deploy] Note: rollback swaps the deployed app image only; it does not revert database schema mutations.\n' >&2
}

DEPLOY_STARTED_AT="$(date +%s)"

start_deploy_stage "load environment"
load_env
require_completed_setup_state "$ROOT_DIR"
finish_deploy_stage "load environment"

DATA_VOLUME="${PM_DEPLOY_DATA_VOLUME:-puppetmaster2_data}"
DEPLOY_AUTH_MODE="$(resolved_deploy_auth_mode)"
DEPLOY_USER_NAME="$(resolved_deploy_user)"

start_deploy_stage "preflight validation"
validate_required_env_values \
  SITE_DOMAIN \
  SERVER_IP \
  ACME_EMAIL \
  DEPLOY_USER_PASSWORD || exit 1
validate_site_domains || exit 1
normalize_site_domain_env
validate_deploy_auth_mode || exit 1
validate_deploy_user || exit 1
validate_pm_settings_encryption_key || fail "PM_SETTINGS_ENCRYPTION_KEY or SETTINGS_ENCRYPTION_KEY must be a real 64+ character hexadecimal secret before deploy."
normalize_settings_encryption_key
validate_deploy_database_url || fail "PM_DEPLOY_DATABASE_URL must be inside /app/data for deploy schema sync."
validate_schema_mode || fail "Schema rollout mode is invalid. Use PM_DEPLOY_SCHEMA_MODE=compatible or PM_DEPLOY_SCHEMA_MODE=maintenance with PM_DEPLOY_MAINTENANCE_ACK=1."

require_command "ansible-playbook" "Arch: sudo pacman -S --needed ansible | Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y ansible"
require_command "ansible-galaxy" "Arch: sudo pacman -S --needed ansible | Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y ansible"
require_command "docker" "Install Docker Desktop or Docker Engine on the deploy machine."
require_command "ssh-keyscan" "sudo apt-get update && sudo apt-get install -y openssh-client"
require_command "ssh-keygen" "sudo apt-get update && sudo apt-get install -y openssh-client"
require_command "curl" "sudo apt-get update && sudo apt-get install -y curl"
require_command "git" "sudo apt-get update && sudo apt-get install -y git"
require_command "node" "Install Node.js on the deploy machine."
if [[ "$(resolved_docker_deploy_mode)" == "local" ]]; then
  require_command "zstd" "Arch: sudo pacman -S --needed zstd | Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y zstd"
fi

SCHEMA_MODE="${PM_DEPLOY_SCHEMA_MODE:-compatible}"
DEPLOY_KNOWN_HOSTS_FILE="$(resolved_deploy_known_hosts_file "$ROOT_DIR")"
DEPLOY_VERSION="${DEPLOY_VERSION:-$(default_deploy_version "$ROOT_DIR")}"
DEPLOY_BUILD_TIMESTAMP="${BUILD_TIMESTAMP:-$(default_build_timestamp)}"
DEPLOY_BUILD_SHA="${BUILD_SHA:-$(resolved_build_sha "$ROOT_DIR")}"
DEPLOY_BUILD_BRANCH="${BUILD_BRANCH:-$(resolved_build_branch "$ROOT_DIR")}"
DEPLOY_BUILD_COMMIT_MESSAGE="${BUILD_COMMIT_MESSAGE:-$(resolved_build_commit_message "$ROOT_DIR")}"
validate_docker_deploy_contract || fail "Docker registry/image settings are invalid."
node "$ROOT_DIR/scripts/generate-launch-assets.mjs"
node "$ROOT_DIR/scripts/check-launch-assets.mjs" || true
if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
  require_command "ssh" "sudo apt-get update && sudo apt-get install -y openssh-client"
  DEPLOY_SSH_KEY="$(expand_tilde_path "${DEPLOY_SSH_KEY:-}")"
  DEPLOY_SSH_KEY_PUB="${DEPLOY_SSH_KEY}.pub"
  validate_required_env_value "DEPLOY_SSH_KEY" "${DEPLOY_SSH_KEY:-}" || exit 1
  [[ -f "$DEPLOY_SSH_KEY" ]] || fail "DEPLOY_SSH_KEY does not exist: $DEPLOY_SSH_KEY"
else
  require_command "sshpass" "sudo apt-get update && sudo apt-get install -y sshpass"
  DEPLOY_SSH_KEY=''
  DEPLOY_SSH_KEY_PUB=''
fi
finish_deploy_stage "preflight validation"

start_deploy_stage "host trust and Ansible collection setup"
bootstrap_known_host_entry "$ROOT_DIR" "$SERVER_IP" || fail "Host trust bootstrap failed. Check SSH reachability, then rerun deploy."
install_ansible_collections "$ROOT_DIR" "deploy"
finish_deploy_stage "host trust and Ansible collection setup"

start_deploy_stage "render deploy artifacts and prepare remote registry"
render_ansible_artifacts
ensure_remote_zstd
ensure_remote_ssh_registry
ensure_remote_traefik_image
finish_deploy_stage "render deploy artifacts and prepare remote registry"

if [[ "$SCHEMA_MODE" == "maintenance" ]]; then
  log "Maintenance schema mode acknowledged. Deploy will create a SQLite backup before schema sync."
else
  log "Compatible schema mode selected. Only additive, backward-compatible schema changes are safe here."
fi

start_deploy_stage "Docker build"
build_and_push_docker_image "$ROOT_DIR" "deploy"
finish_deploy_stage "Docker build"

if [[ "$(resolved_docker_deploy_mode)" == "ssh-registry" ]]; then
  start_deploy_stage "push image layers through SSH registry"
  start_ssh_registry_tunnel
  push_docker_image_to_ssh_registry
  log "Closing SSH registry tunnel before Ansible rollout."
  cleanup_ssh_registry_tunnel
  finish_deploy_stage "push image layers through SSH registry"
fi

if [[ "$(resolved_docker_deploy_mode)" == "local" ]]; then
  start_deploy_stage "stream Docker image to server"
  stream_docker_image_to_server
  LOCAL_DOCKER_IMAGE_PRELOADED='true'
  finish_deploy_stage "stream Docker image to server"
fi

# ─── Docker Compose deploy via Ansible ───────────────────────────────────
start_deploy_stage "app rollout"

PROJECT_ID="${SITE_DOMAIN//./-}"
PROJECT_DOMAIN="${SITE_DOMAIN:-}"

log "Deploying project '$PROJECT_ID' (domain: $PROJECT_DOMAIN) to $SERVER_IP."

run_ansible_deploy() {
  local runtime_vars_file build_vars_file exit_code=0
  runtime_vars_file="$(mktemp)"
  build_vars_file="$(mktemp)"
  render_ansible_runtime_vars_file "$runtime_vars_file" "$DEPLOY_USER_PASSWORD"
  {
    printf 'project_id: %s\n' "$(quote_yaml_value "$PROJECT_ID")"
    printf 'project_domain: %s\n' "$(quote_yaml_value "$PROJECT_DOMAIN")"
    printf 'app_image_ref: %s\n' "$(quote_yaml_value "$(resolved_ansible_app_image_ref)")"
    printf 'deploy_version: %s\n' "$(quote_yaml_value "$DEPLOY_VERSION")"
    printf 'build_timestamp: %s\n' "$(quote_yaml_value "$DEPLOY_BUILD_TIMESTAMP")"
    printf 'build_sha: %s\n' "$(quote_yaml_value "$DEPLOY_BUILD_SHA")"
    printf 'build_branch: %s\n' "$(quote_yaml_value "$DEPLOY_BUILD_BRANCH")"
    printf 'build_commit_message: %s\n' "$(quote_yaml_value "$DEPLOY_BUILD_COMMIT_MESSAGE")"
  } >"$build_vars_file"

  log "Running Ansible deploy playbook."
  (cd "$ROOT_DIR" && ansible-playbook \
    -i ansible/inventory.yml \
    --extra-vars "@$runtime_vars_file" \
    --extra-vars "@$build_vars_file" \
    ansible/deploy.yml) || exit_code=$?
  rm -f "$runtime_vars_file" "$build_vars_file"
  return "$exit_code"
}

if ! run_ansible_deploy; then
  printf '[deploy] Ansible deploy failed after image push.\n' >&2
  print_recovery_guidance
  exit 1
fi

# Regenerate composite Traefik config on server
log "Regenerating composite Traefik config."
export DEPLOY_SSH_KEY DEPLOY_USER_PASSWORD DEPLOY_USER_NAME DEPLOY_KNOWN_HOSTS_FILE
bash "$ROOT_DIR/scripts/pm-traefik-config.sh"

finish_deploy_stage "app rollout"

start_deploy_stage "post-deploy health check"
log "Running post-deploy health check with retries."
if ! health_check_with_retries "deploy" "https://$SITE_DOMAIN/api/health"; then
  print_health_failure_guidance
  print_recovery_guidance
  exit 1
fi
finish_deploy_stage "post-deploy health check"

log "Deploy complete in $(elapsed_seconds "$DEPLOY_STARTED_AT")s."
