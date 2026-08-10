#!/usr/bin/env bash

# shellcheck source=./framework-versions.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/framework-versions.sh"

PM_SETTINGS_ENCRYPTION_KEY_PLACEHOLDER='replace-with-64-character-hex-string-from-openssl'
TOTP_ENCRYPTION_KEY_PLACEHOLDER='replace-with-64-character-hex-string-from-openssl'
DEPLOY_DATABASE_ROOT='/app/data'
SERVER_SSH_HOST_KEY_FINGERPRINT_PLACEHOLDER='SHA256:replace-with-server-host-key-fingerprint'

trim_whitespace() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  printf '%s' "$value"
}

strip_matching_quotes() {
  local value="$1"
  local first_char last_char

  if [[ ${#value} -lt 2 ]]; then
    printf '%s' "$value"
    return
  fi

  first_char="${value:0:1}"
  last_char="${value: -1}"

  if [[ ( "$first_char" == "'" && "$last_char" == "'" ) || ( "$first_char" == '"' && "$last_char" == '"' ) ]]; then
    printf '%s' "${value:1:${#value}-2}"
    return
  fi

  printf '%s' "$value"
}

quote_env_value() {
  local value="$1"
  printf "'%s'" "${value//\'/\'\\\'\'}"
}

format_env_assignment() {
  local key="$1"
  local value="$2"
  printf '%s=%s\n' "$key" "$(quote_env_value "$value")"
}

write_env_line() {
  local key="$1"
  local value="$2"
  format_env_assignment "$key" "$value"
}

load_dotenv_file() {
  local file="$1"
  local line raw key value

  [[ -f "$file" ]] || return 1

  while IFS= read -r line || [[ -n "$line" ]]; do
    raw="${line%$'\r'}"
    raw="$(trim_whitespace "$raw")"

    [[ -z "$raw" ]] && continue
    [[ "${raw:0:1}" == "#" ]] && continue

    if [[ "$raw" == export[[:space:]]* ]]; then
      raw="$(trim_whitespace "${raw#export}")"
    fi

    [[ "$raw" == *=* ]] || continue

    key="$(trim_whitespace "${raw%%=*}")"
    value="${raw#*=}"
    value="$(trim_whitespace "$value")"

    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    value="$(strip_matching_quotes "$value")"
    printf -v "$key" '%s' "$value"
    export "$key=$value"
  done <"$file"
}

expand_tilde_path() {
  local value="$1"

  case "$value" in
    "~") printf '%s\n' "$HOME" ;;
    "~/"*) printf '%s/%s\n' "$HOME" "${value#~/}" ;;
    *) printf '%s\n' "$value" ;;
  esac
}

install_ansible_collections() {
  local root_dir="$1"
  local log_prefix="${2:-deploy-env}"
  local requirements_file="$root_dir/ansible/requirements.yml"

  [[ -f "$requirements_file" ]] || return 0

  printf '[%s] Ensuring Ansible collections from ansible/requirements.yml.\n' "$log_prefix"
  ansible-galaxy collection install -r "$requirements_file"
}

default_deploy_version() {
  local root_dir="$1"
  local git_sha timestamp

  git_sha="$(git -C "$root_dir" rev-parse --short=12 HEAD)"
  timestamp="$(date -u +%Y%m%d%H%M%S)"
  printf '%s-%s\n' "$git_sha" "$timestamp"
}

default_build_timestamp() {
  date -u +%Y-%m-%dT%H:%M:%SZ
}

resolved_build_sha() {
  local root_dir="$1"
  git -C "$root_dir" rev-parse --short=12 HEAD
}

resolved_build_branch() {
  local root_dir="$1"
  git -C "$root_dir" rev-parse --abbrev-ref HEAD
}

resolved_build_commit_message() {
  local root_dir="$1"
  git -C "$root_dir" log -1 --pretty=%s
}

resolved_docker_registry() {
  printf '%s' "${PM_DOCKER_REGISTRY:-docker.io}"
}

resolved_docker_image_tag() {
  printf '%s' "${PM_DOCKER_IMAGE_TAG:-${DEPLOY_VERSION:-}}"
}

resolved_docker_image() {
  printf '%s' "${PM_DOCKER_IMAGE:-$(resolved_app_container_name)}"
}

resolved_app_container_name() {
  printf '%s' "${PM_APP_CONTAINER_NAME:-pm-app}"
}

resolved_app_network_name() {
  printf '%s' "${PM_APP_NETWORK:-pm-shared}"
}

resolved_docker_image_ref() {
  printf '%s:%s' "$(resolved_docker_image)" "$(resolved_docker_image_tag)"
}

resolved_docker_deploy_mode() {
  printf '%s' "${PM_DOCKER_DEPLOY_MODE:-ssh-registry}"
}

resolved_ssh_registry_host() {
  printf '%s' "${PM_DOCKER_SSH_REGISTRY_HOST:-127.0.0.1}"
}

resolved_ssh_registry_port() {
  printf '%s' "${PM_DOCKER_SSH_REGISTRY_PORT:-5000}"
}

resolved_ssh_registry_image() {
  local image
  image="$(resolved_docker_image)"
  image="${image#*/}"
  printf '%s' "$image"
}

resolved_ssh_registry_server_image_ref() {
  printf '%s:%s' "$(resolved_ssh_registry_host):$(resolved_ssh_registry_port)/$(resolved_ssh_registry_image)" "$(resolved_docker_image_tag)"
}

resolved_ansible_app_image_ref() {
  if [[ "$(resolved_docker_deploy_mode)" == "ssh-registry" ]]; then
    resolved_ssh_registry_server_image_ref
    return
  fi

  resolved_docker_image_ref
}

validate_docker_deploy_contract() {
  local deploy_mode
  deploy_mode="$(resolved_docker_deploy_mode)"

  case "$deploy_mode" in
    ssh-registry|local|registry) ;;
    *)
      printf '[deploy-env] PM_DOCKER_DEPLOY_MODE must be ssh-registry, local, or registry.\n' >&2
      return 1
      ;;
  esac

  if [[ -z "$(resolved_docker_image)" ]]; then
    printf '[deploy-env] PM_DOCKER_IMAGE or PM_APP_CONTAINER_NAME is required for Docker-first deploys.\n' >&2
    return 1
  fi

  if [[ -z "$(resolved_docker_image_tag)" ]]; then
    printf '[deploy-env] PM_DOCKER_IMAGE_TAG or DEPLOY_VERSION must be set before Docker image build.\n' >&2
    return 1
  fi

  if [[ "$deploy_mode" == "registry" && "${PM_DOCKER_SKIP_LOGIN:-false}" != "true" ]]; then
    validate_required_env_value "PM_DOCKER_USERNAME" "${PM_DOCKER_USERNAME:-}" || return 1
    validate_required_env_value "PM_DOCKER_TOKEN" "${PM_DOCKER_TOKEN:-}" || return 1
  fi

  if [[ "$deploy_mode" == "ssh-registry" ]]; then
    if [[ ! "$(resolved_ssh_registry_port)" =~ ^[1-9][0-9]{0,4}$ ]]; then
      printf '[deploy-env] PM_DOCKER_SSH_REGISTRY_PORT must be a TCP port number.\n' >&2
      return 1
    fi
  fi

  return 0
}

docker_registry_login() {
  local log_prefix="${1:-deploy}"

  if [[ "${PM_DOCKER_SKIP_LOGIN:-false}" == "true" ]]; then
    printf '[%s] Skipping Docker registry login because PM_DOCKER_SKIP_LOGIN=true.\n' "$log_prefix"
    return 0
  fi

  printf '[%s] Logging in to Docker registry %s.\n' "$log_prefix" "$(resolved_docker_registry)"
  printf '%s' "$PM_DOCKER_TOKEN" | docker login "$(resolved_docker_registry)" --username "$PM_DOCKER_USERNAME" --password-stdin
}

build_and_push_docker_image() {
  local root_dir="$1"
  local log_prefix="${2:-deploy}"
  local image_ref deploy_mode

  image_ref="$(resolved_docker_image_ref)"
  deploy_mode="$(resolved_docker_deploy_mode)"

  printf '[%s] Building Docker image %s.\n' "$log_prefix" "$image_ref"
  (
    cd "$root_dir"
    # Use legacy builder (DOCKER_BUILDKIT=0) for compatibility with Docker
    # versions where BuildKit (buildx) causes multi-stage image export failures
    # (e.g. Docker 29.6.1 + cgroup v2 "context canceled" bug).
    DOCKER_BUILDKIT=0 docker build \
      --build-arg "PM_NODE_IMAGE=${PM_NODE_IMAGE:-$(default_node_image)}" \
      --build-arg "BUILD_VERSION=${DEPLOY_VERSION:-}" \
      --build-arg "BUILD_TIMESTAMP=${DEPLOY_BUILD_TIMESTAMP:-}" \
      --build-arg "BUILD_SHA=${DEPLOY_BUILD_SHA:-}" \
      --build-arg "BUILD_BRANCH=${DEPLOY_BUILD_BRANCH:-}" \
      --build-arg "BUILD_COMMIT_MESSAGE=${DEPLOY_BUILD_COMMIT_MESSAGE:-}" \
      -t "$image_ref" \
      .
  )

  prune_old_deploy_images "$(resolved_docker_image)" "$(resolved_app_container_name)" "$log_prefix"

  if [[ "$deploy_mode" == "local" || "$deploy_mode" == "ssh-registry" ]]; then
    printf '[%s] %s Docker deploy mode selected; skipping external registry login and push.\n' "$log_prefix" "$deploy_mode"
    return 0
  fi

  docker_registry_login "$log_prefix"

  printf '[%s] Pushing Docker image %s.\n' "$log_prefix" "$image_ref"
  docker push "$image_ref"
}

prune_old_deploy_images() {
  local image_name="$1"
  local container_name="$2"
  local log_prefix="${3:-deploy}"
  local keep="${PM_DOCKER_KEEP_IMAGES:-5}"

  local old_images
  old_images=$(docker images "$image_name" --format '{{.ID}} {{.CreatedAt}}' 2>/dev/null | sort -rk2 | tail -n +$((keep + 1)) | awk '{print $1}')
  if [[ -n "$old_images" ]]; then
    printf '[%s] Pruning old deploy images (keeping %s).\n' "$log_prefix" "$keep"
    echo "$old_images" | xargs -r docker rmi -f 2>/dev/null || true
  fi

  docker image prune -f --filter "dangling=true" 2>/dev/null || true
}

save_docker_image_archive() {
  local archive_path="$1"
  local log_prefix="${2:-deploy}"
  local image_ref

  image_ref="$(resolved_docker_image_ref)"
  printf '[%s] Saving Docker image %s for direct server transfer.\n' "$log_prefix" "$image_ref"
  docker save "$image_ref" | gzip -c >"$archive_path"
}

quote_yaml_value() {
  local value="$1"
  local escaped
  escaped="${value//\'/\'\'}"
  printf "'%s'" "$escaped"
}

deploy_auth_mode_from_ssh_key_flag() {
  local value="$1"

  value="$(trim_whitespace "$value")"
  value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"

  case "$value" in
    true|1|yes|y|on)
      printf '%s' "ssh_key"
      ;;
    false|0|no|n|off)
      printf '%s' "password"
      ;;
    *)
      printf '%s' "__invalid_ssh_key_flag__"
      ;;
  esac
}

resolved_deploy_auth_mode() {
  if [[ -n "${SSH_KEY+x}" ]]; then
    deploy_auth_mode_from_ssh_key_flag "$SSH_KEY"
    return
  fi

  if [[ -n "${ssh_key+x}" ]]; then
    deploy_auth_mode_from_ssh_key_flag "$ssh_key"
    return
  fi

  printf '%s' "${PM_DEPLOY_AUTH_MODE:-ssh_key}"
}

resolved_deploy_user() {
  local deploy_user
  deploy_user="${DEPLOY_USER:-${PM_DEPLOY_USER:-deploy}}"
  deploy_user="$(trim_whitespace "$deploy_user")"
  printf '%s' "$deploy_user"
}

resolved_server_host_key_fingerprint() {
  printf '%s' "${SERVER_SSH_HOST_KEY_FINGERPRINT:-}"
}

normalize_domain_name() {
  local value="$1"
  value="$(trim_whitespace "$value")"
  value="${value%.}"
  printf '%s' "$value" | tr '[:upper:]' '[:lower:]'
}

resolved_site_domain() {
  normalize_domain_name "${SITE_DOMAIN:-}"
}

validate_domain_name() {
  local key="$1"
  local value="$2"
  local label
  local labels

  if [[ -z "$value" ]]; then
    printf '[deploy-env] %s is required.\n' "$key" >&2
    return 1
  fi

  if [[ "$value" == *"://"* || "$value" == *"/"* || "$value" == *":"* ]]; then
    printf '[deploy-env] %s must be a bare domain name, not a URL: %s\n' "$key" "$value" >&2
    return 1
  fi

  if [[ ${#value} -gt 253 || "$value" != *.* ]]; then
    printf '[deploy-env] %s must be a fully qualified domain name: %s\n' "$key" "$value" >&2
    return 1
  fi

  IFS='.' read -r -a labels <<<"$value"
  for label in "${labels[@]}"; do
    if [[ -z "$label" || ${#label} -gt 63 || ! "$label" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
      printf '[deploy-env] %s contains an invalid DNS label: %s\n' "$key" "$value" >&2
      return 1
    fi
  done

  return 0
}

resolved_site_domain_aliases() {
  local primary
  local raw_aliases
  local alias
  local aliases=()
  local seen=' '

  primary="$(resolved_site_domain)"
  raw_aliases="${SITE_DOMAIN_ALIASES:-}"
  raw_aliases="${raw_aliases//,/ }"
  seen=" $primary "

  for alias in $raw_aliases; do
    alias="$(normalize_domain_name "$alias")"
    [[ -n "$alias" ]] || continue
    validate_required_env_value "SITE_DOMAIN_ALIASES" "$alias" || return 1
    validate_domain_name "SITE_DOMAIN_ALIASES" "$alias" || return 1

    if [[ "$seen" == *" $alias "* ]]; then
      continue
    fi

    aliases+=("$alias")
    seen+="$alias "
  done

  printf '%s' "${aliases[*]}"
}

validate_site_domains() {
  local primary
  primary="$(resolved_site_domain)"

  validate_required_env_value "SITE_DOMAIN" "$primary" || return 1
  validate_domain_name "SITE_DOMAIN" "$primary" || return 1
  resolved_site_domain_aliases >/dev/null
}

normalize_site_domain_env() {
  local primary
  local aliases

  primary="$(resolved_site_domain)"
  aliases="$(resolved_site_domain_aliases)"

  printf -v SITE_DOMAIN '%s' "$primary"
  printf -v SITE_DOMAIN_ALIASES '%s' "$aliases"
  export SITE_DOMAIN SITE_DOMAIN_ALIASES
}

escape_regex_domain() {
  local value="$1"
  value="${value//./\\.}"
  printf '%s' "$value"
}

resolved_traefik_host_rule() {
  local primary
  local aliases
  local alias
  local rule

  primary="$(resolved_site_domain)"
  aliases="$(resolved_site_domain_aliases)"
  rule="Host(\`$primary\`)"

  for alias in $aliases; do
    rule+=" || Host(\`$alias\`)"
  done

  printf '%s' "$rule"
}

resolved_traefik_alias_redirect_regex() {
  local aliases
  local alias
  local escaped_aliases=()
  local escaped

  aliases="$(resolved_site_domain_aliases)"
  [[ -n "$aliases" ]] || return 0

  for alias in $aliases; do
    escaped="$(escape_regex_domain "$alias")"
    escaped_aliases+=("$escaped")
  done

  local IFS='|'
  printf '^https?://(%s)(/.*)?$' "${escaped_aliases[*]}"
}

resolved_traefik_alias_redirect_replacement() {
  local primary
  primary="$(resolved_site_domain)"
  printf 'https://%s${2}' "$primary"
}

resolved_deploy_known_hosts_file() {
  local root_dir="$1"
  printf '%s' "${PM_DEPLOY_KNOWN_HOSTS_FILE:-$root_dir/ansible/known_hosts}"
}

resolved_pm_deploy_state_file() {
  local root_dir="$1"
  printf '%s' "${PM_DEPLOY_STATE_FILE:-$root_dir/.pm-deploy-state.json}"
}

write_pm_deploy_state() {
  local root_dir="$1"
  local stage="$2"
  local status="$3"
  local reason="${4:-}"
  local touched_production="${5:-false}"
  local deploy_user="${6:-}"
  local deploy_auth_mode="${7:-}"
  local deploy_access_verified="${8:-false}"
  local deploy_user_bootstrap_completed="${9:-false}"
  local state_file

  state_file="$(resolved_pm_deploy_state_file "$root_dir")"
  mkdir -p "$(dirname "$state_file")"

  PM_DEPLOY_STATE_FILE="$state_file" \
  PM_DEPLOY_STATE_STAGE="$stage" \
  PM_DEPLOY_STATE_STATUS="$status" \
  PM_DEPLOY_STATE_REASON="$reason" \
  PM_DEPLOY_STATE_TOUCHED_PRODUCTION="$touched_production" \
  PM_DEPLOY_STATE_DEPLOY_USER="$deploy_user" \
  PM_DEPLOY_STATE_AUTH_MODE="$deploy_auth_mode" \
  PM_DEPLOY_STATE_ACCESS_VERIFIED="$deploy_access_verified" \
  PM_DEPLOY_STATE_BOOTSTRAP_COMPLETED="$deploy_user_bootstrap_completed" \
    node <<'NODE'
const fs = require('node:fs')

const file = process.env.PM_DEPLOY_STATE_FILE
const previous = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
const truthy = value => ['true', '1', 'yes', 'y', 'on'].includes(String(value || '').toLowerCase())
const state = {
  ...previous,
  updatedAt: new Date().toISOString(),
  stage: process.env.PM_DEPLOY_STATE_STAGE,
  status: process.env.PM_DEPLOY_STATE_STATUS,
  reason: process.env.PM_DEPLOY_STATE_REASON || '',
  touchedProduction: truthy(process.env.PM_DEPLOY_STATE_TOUCHED_PRODUCTION),
  deployUser: process.env.PM_DEPLOY_STATE_DEPLOY_USER || previous.deployUser || '',
  deployAuthMode: process.env.PM_DEPLOY_STATE_AUTH_MODE || previous.deployAuthMode || '',
  deployAccessVerified:
    truthy(process.env.PM_DEPLOY_STATE_ACCESS_VERIFIED) || Boolean(previous.deployAccessVerified),
  deployUserBootstrapCompleted:
    truthy(process.env.PM_DEPLOY_STATE_BOOTSTRAP_COMPLETED) ||
    Boolean(previous.deployUserBootstrapCompleted)
}

if (state.stage === 'setup_complete' && state.status === 'completed') {
  state.setupComplete = true
}

if (state.status === 'failed') {
  state.setupComplete = false
}

fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
fs.chmodSync(file, 0o600)
NODE
}

require_completed_setup_state() {
  local root_dir="$1"
  local state_file

  state_file="$(resolved_pm_deploy_state_file "$root_dir")"
  [[ -f "$state_file" ]] || return 0

  PM_DEPLOY_STATE_FILE="$state_file" node <<'NODE'
const fs = require('node:fs')

const file = process.env.PM_DEPLOY_STATE_FILE
const state = JSON.parse(fs.readFileSync(file, 'utf8'))

if (state.setupComplete === true) {
  process.exit(0)
}

console.error('[deploy] Setup is incomplete; refusing deploy before steady-state access is proven.')
console.error(`[deploy] Last stage: ${state.stage || 'unknown'}`)
console.error(`[deploy] Status: ${state.status || 'unknown'}`)
if (state.reason) console.error(`[deploy] Reason: ${state.reason}`)
console.error('[deploy] Safe resume command: npm run setup:resume')
console.error('[deploy] Required .env keys: SITE_DOMAIN, SERVER_IP, ACME_EMAIL, PM_SETTINGS_ENCRYPTION_KEY, DEPLOY_USER, DEPLOY_USER_PASSWORD, SSH_KEY/PM_DEPLOY_AUTH_MODE, DEPLOY_SSH_KEY when SSH_KEY=true.')
process.exit(1)
NODE
}

resolved_release_state_dir() {
  printf '/home/%s/app/releases' "$(resolved_deploy_user)"
}

resolved_health_check_retries() {
  printf '%s' "${PM_DEPLOY_HEALTH_RETRIES:-8}"
}

resolved_health_check_initial_delay() {
  printf '%s' "${PM_DEPLOY_HEALTH_INITIAL_DELAY_SECONDS:-3}"
}

resolved_health_check_backoff() {
  printf '%s' "${PM_DEPLOY_HEALTH_BACKOFF_SECONDS:-3}"
}

resolved_health_check_connect_timeout() {
  printf '%s' "${PM_DEPLOY_HEALTH_CONNECT_TIMEOUT_SECONDS:-5}"
}

resolved_health_check_max_time() {
  printf '%s' "${PM_DEPLOY_HEALTH_MAX_TIME_SECONDS:-15}"
}

health_check_with_retries() {
  local log_prefix="$1"
  local health_url="$2"
  local retries initial_delay backoff connect_timeout max_time attempt sleep_seconds curl_output curl_exit

  retries="$(resolved_health_check_retries)"
  initial_delay="$(resolved_health_check_initial_delay)"
  backoff="$(resolved_health_check_backoff)"
  connect_timeout="$(resolved_health_check_connect_timeout)"
  max_time="$(resolved_health_check_max_time)"

  if ! [[ "$retries" =~ ^[1-9][0-9]*$ ]]; then
    printf '[%s] Invalid PM_DEPLOY_HEALTH_RETRIES: %s\n' "$log_prefix" "$retries" >&2
    return 1
  fi

  if ! [[ "$initial_delay" =~ ^[0-9]+$ ]]; then
    printf '[%s] Invalid PM_DEPLOY_HEALTH_INITIAL_DELAY_SECONDS: %s\n' "$log_prefix" "$initial_delay" >&2
    return 1
  fi

  if ! [[ "$backoff" =~ ^[0-9]+$ ]]; then
    printf '[%s] Invalid PM_DEPLOY_HEALTH_BACKOFF_SECONDS: %s\n' "$log_prefix" "$backoff" >&2
    return 1
  fi

  if ! [[ "$connect_timeout" =~ ^[1-9][0-9]*$ ]]; then
    printf '[%s] Invalid PM_DEPLOY_HEALTH_CONNECT_TIMEOUT_SECONDS: %s\n' "$log_prefix" "$connect_timeout" >&2
    return 1
  fi

  if ! [[ "$max_time" =~ ^[1-9][0-9]*$ ]]; then
    printf '[%s] Invalid PM_DEPLOY_HEALTH_MAX_TIME_SECONDS: %s\n' "$log_prefix" "$max_time" >&2
    return 1
  fi

  for ((attempt = 1; attempt <= retries; attempt++)); do
    set +e
    curl_output="$(curl -fsS --connect-timeout "$connect_timeout" --max-time "$max_time" "$health_url" 2>&1 >/dev/null)"
    curl_exit=$?
    set -e

    if [[ $curl_exit -eq 0 ]]; then
      printf '[%s] Health check passed on attempt %d/%d.\n' "$log_prefix" "$attempt" "$retries"
      return 0
    fi

    if (( attempt == retries )); then
      break
    fi

    sleep_seconds=$((initial_delay + ((attempt - 1) * backoff)))
    if [[ $curl_exit -eq 28 ]]; then
      printf '[%s] Health check attempt %d/%d timed out after %ss total / %ss connect timeout. Retrying in %ss.\n' "$log_prefix" "$attempt" "$retries" "$max_time" "$connect_timeout" "$sleep_seconds"
    else
      printf '[%s] Health check attempt %d/%d failed with curl exit %d: %s Retrying in %ss.\n' "$log_prefix" "$attempt" "$retries" "$curl_exit" "$curl_output" "$sleep_seconds"
    fi
    sleep "$sleep_seconds"
  done

  if [[ ${curl_exit:-1} -eq 28 ]]; then
    printf '[%s] Health check failed: final attempt timed out after %ss total / %ss connect timeout.\n' "$log_prefix" "$max_time" "$connect_timeout" >&2
  else
    printf '[%s] Health check failed: final curl exit %d: %s\n' "$log_prefix" "${curl_exit:-1}" "${curl_output:-no output}" >&2
  fi

  return 1
}

validate_deploy_auth_mode() {
  local mode
  mode="$(resolved_deploy_auth_mode)"

  case "$mode" in
    password|ssh_key) ;;
    __invalid_ssh_key_flag__)
      printf '[deploy-env] SSH_KEY must be true or false when set.\n' >&2
      return 1
      ;;
    *)
      printf '[deploy-env] PM_DEPLOY_AUTH_MODE must be one of: password, ssh_key.\n' >&2
      return 1
      ;;
  esac

  return 0
}

validate_deploy_user() {
  local deploy_user
  deploy_user="$(resolved_deploy_user)"

  if [[ -z "$deploy_user" ]]; then
    printf '[deploy-env] DEPLOY_USER is required.\n' >&2
    return 1
  fi

  if [[ ! "$deploy_user" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]]; then
    printf '[deploy-env] DEPLOY_USER must be a Linux username using lowercase letters, numbers, _ or -, starting with a letter or underscore.\n' >&2
    return 1
  fi

  return 0
}

ensure_restricted_file() {
  local file="$1"

  mkdir -p "$(dirname "$file")"
  touch "$file"
  chmod 600 "$file"
}

ssh_key_file_contains_fingerprint() {
  local key_file="$1"
  local expected_fingerprint="$2"
  local fingerprint

  while read -r _ fingerprint _; do
    if [[ "$fingerprint" == "$expected_fingerprint" ]]; then
      return 0
    fi
  done < <(ssh-keygen -lf "$key_file" -E sha256 2>/dev/null)

  return 1
}

bootstrap_known_host_entry() {
  local root_dir="$1"
  local server_ip="$2"
  local known_hosts_file
  local expected_fingerprint
  local scan_file
  local existing_entries_file
  local require_verified_fingerprint="${PM_DEPLOY_REQUIRE_HOST_FINGERPRINT:-false}"

  known_hosts_file="$(resolved_deploy_known_hosts_file "$root_dir")"
  ensure_restricted_file "$known_hosts_file"

  expected_fingerprint="$(resolved_server_host_key_fingerprint)"
  if is_placeholder_env_value "SERVER_SSH_HOST_KEY_FINGERPRINT" "$expected_fingerprint"; then
    expected_fingerprint=''
  fi

  if [[ -n "$expected_fingerprint" && "$expected_fingerprint" != SHA256:* ]]; then
    printf '[deploy-env] SERVER_SSH_HOST_KEY_FINGERPRINT must be a SHA256 SSH host key fingerprint.\n' >&2
    return 1
  fi

  existing_entries_file="$(mktemp)"
  if ssh-keygen -F "$server_ip" -f "$known_hosts_file" >"$existing_entries_file" 2>/dev/null; then
    if [[ -z "$expected_fingerprint" ]]; then
      rm -f "$existing_entries_file"
      return 0
    fi

    if ssh_key_file_contains_fingerprint "$existing_entries_file" "$expected_fingerprint"; then
      rm -f "$existing_entries_file"
      return 0
    fi

    rm -f "$existing_entries_file"
    printf '[deploy-env] Existing known_hosts entry for %s does not match SERVER_SSH_HOST_KEY_FINGERPRINT.\n' "$server_ip" >&2
    printf '[deploy-env] Expected %s. Remove or replace the stale known_hosts entry only after verifying the real host key out of band.\n' "$expected_fingerprint" >&2
    printf '[deploy-env] Refusing to continue with a mismatched trusted host key.\n' >&2
    return 1
  fi
  rm -f "$existing_entries_file"

  if [[ -z "$expected_fingerprint" && "$require_verified_fingerprint" == "true" ]]; then
    printf '[deploy-env] SERVER_SSH_HOST_KEY_FINGERPRINT is required because PM_DEPLOY_REQUIRE_HOST_FINGERPRINT=true.\n' >&2
    return 1
  fi

  scan_file="$(mktemp)"
  if ! ssh-keyscan -H -T 5 "$server_ip" >"$scan_file" 2>/dev/null || [[ ! -s "$scan_file" ]]; then
    rm -f "$scan_file"
    printf '[deploy-env] Unable to fetch SSH host keys from %s with ssh-keyscan.\n' "$server_ip" >&2
    return 1
  fi

  if [[ -n "$expected_fingerprint" ]] && ! ssh_key_file_contains_fingerprint "$scan_file" "$expected_fingerprint"; then
    rm -f "$scan_file"
    printf '[deploy-env] SSH host key fingerprint mismatch for %s.\n' "$server_ip" >&2
    printf '[deploy-env] Expected %s. Refusing to trust the scanned host key.\n' "$expected_fingerprint" >&2
    return 1
  fi

  if [[ -z "$expected_fingerprint" ]]; then
    printf '[deploy-env] SERVER_SSH_HOST_KEY_FINGERPRINT is not set; trusting first scanned host key for %s.\n' "$server_ip" >&2
  fi

  cat "$scan_file" >>"$known_hosts_file"
  chmod 600 "$known_hosts_file"
  rm -f "$scan_file"
}

is_placeholder_env_value() {
  local key="$1"
  local value="$2"

  case "$value" in
    ""|"changeme"|"CHANGE_ME"|"your-value-here")
      return 0
      ;;
  esac

  case "$key" in
    SITE_DOMAIN)
      [[ "$value" == "example.com" ]]
      return
      ;;
    SITE_DOMAIN_ALIASES)
      [[ "$value" == "www.example.com" || "$value" == "www.example.com,example.net" ]]
      return
      ;;
    SERVER_IP)
      [[ "$value" == "your-server-ip" || "$value" == "123.45.67.89" ]]
      return
      ;;
    SERVER_ROOT_PASSWORD)
      [[ "$value" == "the-root-password-from-vps-provider" ]]
      return
      ;;
    SERVER_SSH_HOST_KEY_FINGERPRINT)
      [[ "$value" == "$SERVER_SSH_HOST_KEY_FINGERPRINT_PLACEHOLDER" ]]
      return
      ;;
    ACME_EMAIL)
      [[ "$value" == "admin@example.com" ]]
      return
      ;;
  esac

  return 1
}

validate_required_env_value() {
  local key="$1"
  local value="$2"

  if is_placeholder_env_value "$key" "$value"; then
    printf '[deploy-env] %s is missing or still uses the sample value from .env.example.\n' "$key" >&2
    printf '[deploy-env] Update .env with the real deploy value, then re-run.\n' >&2
    return 1
  fi

  return 0
}

validate_required_env_values() {
  local key value

  for key in "$@"; do
    value="${!key:-}"
    validate_required_env_value "$key" "$value" || return 1
  done

  return 0
}

validate_optional_env_value_if_set() {
  local key="$1"
  local value="$2"

  [[ -n "$value" ]] || return 0
  validate_required_env_value "$key" "$value"
}

validate_required_hex_secret() {
  local key="$1"
  local value="$2"
  local placeholder="$3"
  local min_length="$4"

  if [[ -z "$value" ]]; then
    printf '[deploy-env] %s is required.\n' "$key" >&2
    return 1
  fi

  if [[ "$value" == "$placeholder" ]]; then
    printf '[deploy-env] %s still uses the example placeholder value.\n' "$key" >&2
    return 1
  fi

  if [[ ${#value} -lt "$min_length" ]]; then
    printf '[deploy-env] %s must be at least %s characters long.\n' "$key" "$min_length" >&2
    return 1
  fi

  if [[ ! "$value" =~ ^[A-Fa-f0-9]+$ ]]; then
    printf '[deploy-env] %s must be a hexadecimal string.\n' "$key" >&2
    return 1
  fi

  return 0
}

resolved_settings_encryption_key() {
  if [[ -n "${PM_SETTINGS_ENCRYPTION_KEY:-}" ]]; then
    printf '%s' "$PM_SETTINGS_ENCRYPTION_KEY"
    return
  fi

  printf '%s' "${SETTINGS_ENCRYPTION_KEY:-}"
}

validate_pm_settings_encryption_key() {
  local resolved_key

  if [[ -n "${PM_SETTINGS_ENCRYPTION_KEY:-}" && -n "${SETTINGS_ENCRYPTION_KEY:-}" && "$PM_SETTINGS_ENCRYPTION_KEY" != "$SETTINGS_ENCRYPTION_KEY" ]]; then
    printf '[deploy-env] PM_SETTINGS_ENCRYPTION_KEY and SETTINGS_ENCRYPTION_KEY are both set but differ. Keep one canonical value.\n' >&2
    return 1
  fi

  resolved_key="$(resolved_settings_encryption_key)"

  validate_required_hex_secret \
    "PM_SETTINGS_ENCRYPTION_KEY or SETTINGS_ENCRYPTION_KEY" \
    "$resolved_key" \
    "$PM_SETTINGS_ENCRYPTION_KEY_PLACEHOLDER" \
    64
}

normalize_settings_encryption_key() {
  local resolved_key
  resolved_key="$(resolved_settings_encryption_key)"
  printf -v PM_SETTINGS_ENCRYPTION_KEY '%s' "$resolved_key"
  export PM_SETTINGS_ENCRYPTION_KEY
}

# TOTP_ENCRYPTION_KEY is required at runtime when FEATURES.twoFactorAuth is
# enabled in production (src/hooks.server.ts fail-fast). Unlike the settings
# key it has no legacy alias; only PM-prefixed and bare forms are accepted.
resolved_totp_encryption_key() {
  if [[ -n "${PM_TOTP_ENCRYPTION_KEY:-}" ]]; then
    printf '%s' "$PM_TOTP_ENCRYPTION_KEY"
    return
  fi

  printf '%s' "${TOTP_ENCRYPTION_KEY:-}"
}

validate_pm_totp_encryption_key() {
  local resolved_key
  resolved_key="$(resolved_totp_encryption_key)"

  validate_required_hex_secret \
    "PM_TOTP_ENCRYPTION_KEY or TOTP_ENCRYPTION_KEY" \
    "$resolved_key" \
    "$TOTP_ENCRYPTION_KEY_PLACEHOLDER" \
    64
}

normalize_totp_encryption_key() {
  local resolved_key
  resolved_key="$(resolved_totp_encryption_key)"
  printf -v TOTP_ENCRYPTION_KEY '%s' "$resolved_key"
  export TOTP_ENCRYPTION_KEY
}

# Admin bootstrap rotation is MANDATORY for production deploys (security
# audit: a guessable or empty master/admin credential makes the admin entry
# point trivially predictable). Rotation cannot be opted out, and ALL THREE
# privileged credentials (master/admin/editor) must be set — the rotation
# container fails without any of them, so fail at preflight, not mid-deploy.
validate_admin_rotation_contract() {
  local rotation_enabled
  rotation_enabled="${PM_ADMIN_PASSWORD_ROTATION_ENABLED:-true}"

  if [[ "$rotation_enabled" != "true" ]]; then
    printf '[deploy] PM_ADMIN_PASSWORD_ROTATION_ENABLED must be true — rotation of master/admin credentials is mandatory.\n' >&2
    return 1
  fi

  local missing=()
  [[ -z "${PM_ADMIN_MASTER_PASSWORD:-}" ]] && missing+=("PM_ADMIN_MASTER_PASSWORD")
  [[ -z "${PM_ADMIN_ADMIN_PASSWORD:-}" ]] && missing+=("PM_ADMIN_ADMIN_PASSWORD")
  [[ -z "${PM_ADMIN_USER_PASSWORD:-}" ]] && missing+=("PM_ADMIN_USER_PASSWORD")

  if [[ ${#missing[@]} -gt 0 ]]; then
    printf '[deploy] Missing required admin bootstrap credential(s): %s\n' "${missing[*]}" >&2
    printf '[deploy] Generate strong random values with: node scripts/rotate-admin-passwords.mjs --generate --write-env\n' >&2
    return 1
  fi

  return 0
}

# NOTE (audit I-1): PM_SETTINGS_ENCRYPTION_KEY is generated and validated by the
# deploy pipeline for PM2 parity, but NO src/ application code reads it today —
# there is no encrypted-settings feature in PM3 yet. Do NOT add a boot-time
# fail-fast for it: a check on an unused key would crash healthy servers.
# If encrypted settings storage is ever implemented, port PM2's fail-fast from
# server/plugins/01.env-validation.ts at that time. This key is intentionally
# reserved/dead until then.

resolved_database_url() {
  printf '%s' "${PM_DEPLOY_DATABASE_URL:-${DATABASE_URL:-/app/data/sqlite.db}}"
}

resolved_database_relative_path() {
  local database_url
  database_url="$(resolved_database_url)"

  printf '%s' "${database_url#"$DEPLOY_DATABASE_ROOT"/}"
}

validate_deploy_database_url() {
  local database_url
  local relative_path
  database_url="$(resolved_database_url)"

  case "$database_url" in
    "$DEPLOY_DATABASE_ROOT"/*) ;;
    *)
      printf '[deploy-env] PM_DEPLOY_DATABASE_URL or DATABASE_URL must point inside %s for volume-backed deploys. Got: %s\n' "$DEPLOY_DATABASE_ROOT" "$database_url" >&2
      printf '[deploy-env] The deploy workflow mounts production data beneath %s and expects the app container to read from that path.\n' "$DEPLOY_DATABASE_ROOT" >&2
      return 1
      ;;
  esac

  relative_path="$(resolved_database_relative_path)"
  if [[ -z "$relative_path" || "$relative_path" == "$database_url" || "$relative_path" == */ || "$relative_path" == "." || "$relative_path" == ".." || "$relative_path" == *"/../"* || "$relative_path" == "../"* ]]; then
    printf '[deploy-env] PM_DEPLOY_DATABASE_URL or DATABASE_URL must resolve to a concrete file path inside %s. Got: %s\n' "$DEPLOY_DATABASE_ROOT" "$database_url" >&2
    return 1
  fi

  return 0
}

validate_schema_mode() {
  local mode="${PM_DEPLOY_SCHEMA_MODE:-compatible}"

  case "$mode" in
    compatible|maintenance) ;;
    *)
      printf '[deploy-env] PM_DEPLOY_SCHEMA_MODE must be one of: compatible, maintenance.\n' >&2
      return 1
      ;;
  esac

  if [[ "$mode" == "maintenance" && "${PM_DEPLOY_MAINTENANCE_ACK:-}" != "1" ]]; then
    printf '[deploy-env] PM_DEPLOY_SCHEMA_MODE=maintenance requires PM_DEPLOY_MAINTENANCE_ACK=1.\n' >&2
    return 1
  fi

  return 0
}

render_ansible_deploy_vars_file() {
  local output_file="$1"
  local deploy_auth_mode="${2:-$(resolved_deploy_auth_mode)}"
  local deploy_user

  deploy_user="$(resolved_deploy_user)"

  mkdir -p "$(dirname "$output_file")"

  {
    cat <<EOF
site_domain: $(quote_yaml_value "$(resolved_site_domain)")
site_domain_aliases: $(quote_yaml_value "$(resolved_site_domain_aliases)")
traefik_host_rule: $(quote_yaml_value "$(resolved_traefik_host_rule)")
traefik_alias_redirect_regex: $(quote_yaml_value "$(resolved_traefik_alias_redirect_regex)")
traefik_alias_redirect_replacement: $(quote_yaml_value "$(resolved_traefik_alias_redirect_replacement)")
server_ip: $(quote_yaml_value "${SERVER_IP:-}")
deploy_user: $(quote_yaml_value "$deploy_user")
deploy_user_password: $(quote_yaml_value "${DEPLOY_USER_PASSWORD:-}")
deploy_auth_mode: $(quote_yaml_value "$deploy_auth_mode")
deploy_ssh_key: $(quote_yaml_value "${DEPLOY_SSH_KEY:-}")
acme_email: $(quote_yaml_value "${ACME_EMAIL:-}")
database_url: $(quote_yaml_value "$(resolved_database_url)")
database_relative_path: $(quote_yaml_value "$(resolved_database_relative_path)")
pm_deploy_data_volume: $(quote_yaml_value "${PM_DEPLOY_DATA_VOLUME:-pm_data}")
pm_deploy_uploads_volume: $(quote_yaml_value "${PM_DEPLOY_UPLOADS_VOLUME:-pm_uploads}")
pm_settings_encryption_key: $(quote_yaml_value "$(resolved_settings_encryption_key)")
totp_encryption_key: $(quote_yaml_value "$(resolved_totp_encryption_key)")
pm_deploy_schema_mode: $(quote_yaml_value "${PM_DEPLOY_SCHEMA_MODE:-compatible}")
pm_deploy_repair_shared_ownership: $(quote_yaml_value "${PM_DEPLOY_REPAIR_SHARED_OWNERSHIP:-false}")
app_version: $(quote_yaml_value "${APP_VERSION:-0.1.0}")
uptime_kuma_subdomain: $(quote_yaml_value "${UPTIME_KUMA_SUBDOMAIN:-}")
pm_monitoring_netdata_enabled: $(quote_yaml_value "${PM_MONITORING_NETDATA_ENABLED:-true}")
pm_backup_cron_enabled: $(quote_yaml_value "${PM_DEPLOY_BACKUP_CRON:-false}")
netdata_url: $(quote_yaml_value "${NETDATA_URL:-http://127.0.0.1:19999}")
pm_ops_agent_enabled: $(quote_yaml_value "${PM_OPS_AGENT_ENABLED:-true}")
pm_ops_agent_token: $(quote_yaml_value "${PM_OPS_AGENT_TOKEN:-$(resolved_settings_encryption_key)}")
pm_admin_password_rotation_enabled: $(quote_yaml_value "${PM_ADMIN_PASSWORD_ROTATION_ENABLED:-true}")
pm_admin_master_email: $(quote_yaml_value "${PM_ADMIN_MASTER_EMAIL:-master@example.com}")
pm_admin_master_password: $(quote_yaml_value "${PM_ADMIN_MASTER_PASSWORD:-}")
pm_admin_admin_email: $(quote_yaml_value "${PM_ADMIN_ADMIN_EMAIL:-admin@example.com}")
pm_admin_admin_password: $(quote_yaml_value "${PM_ADMIN_ADMIN_PASSWORD:-}")
pm_admin_user_email: $(quote_yaml_value "${PM_ADMIN_USER_EMAIL:-editor@example.com}")
pm_admin_user_password: $(quote_yaml_value "${PM_ADMIN_USER_PASSWORD:-}")
smtp_host: $(quote_yaml_value "${SMTP_HOST:-}")
smtp_port: $(quote_yaml_value "${SMTP_PORT:-}")
smtp_user: $(quote_yaml_value "${SMTP_USER:-}")
smtp_pass: $(quote_yaml_value "${SMTP_PASS:-}")
smtp_from: $(quote_yaml_value "${SMTP_FROM:-}")
s3_endpoint: $(quote_yaml_value "${S3_ENDPOINT:-}")
s3_bucket: $(quote_yaml_value "${S3_BUCKET:-}")
s3_access_key: $(quote_yaml_value "${S3_ACCESS_KEY:-}")
s3_secret_key: $(quote_yaml_value "${S3_SECRET_KEY:-}")
s3_region: $(quote_yaml_value "${S3_REGION:-}")
s3_visibility: $(quote_yaml_value "${S3_VISIBILITY:-}")
s3_public_url: $(quote_yaml_value "${S3_PUBLIC_URL:-}")
s3_proxy_signing_key: $(quote_yaml_value "${S3_PROXY_SIGNING_KEY:-}")
api_base_url: $(quote_yaml_value "${API_BASE_URL:-}")
api_client_id: $(quote_yaml_value "${API_CLIENT_ID:-}")
api_client_secret: $(quote_yaml_value "${API_CLIENT_SECRET:-}")
api_token_url: $(quote_yaml_value "${API_TOKEN_URL:-}")
api_jwt_token: $(quote_yaml_value "${API_JWT_TOKEN:-}")
api_key: $(quote_yaml_value "${API_KEY:-}")
api_token_refresh_buffer: $(quote_yaml_value "${API_TOKEN_REFRESH_BUFFER:-300}")
redis_url: $(quote_yaml_value "${REDIS_URL:-}")
redis_prefix: $(quote_yaml_value "${REDIS_PREFIX:-pm-cache:}")
app_service_name: 'pm'
app_container_name: $(quote_yaml_value "$(resolved_app_container_name)")
app_network_name: $(quote_yaml_value "$(resolved_app_network_name)")
app_image: $(quote_yaml_value "$(resolved_docker_image)")
app_image_tag: $(quote_yaml_value "$(resolved_docker_image_tag)")
app_image_ref: $(quote_yaml_value "$(resolved_ansible_app_image_ref)")
docker_deploy_mode: $(quote_yaml_value "$(resolved_docker_deploy_mode)")
docker_registry: $(quote_yaml_value "$(resolved_docker_registry)")
docker_username: $(quote_yaml_value "${PM_DOCKER_USERNAME:-}")
docker_token: $(quote_yaml_value "${PM_DOCKER_TOKEN:-}")
docker_skip_login: $(quote_yaml_value "${PM_DOCKER_SKIP_LOGIN:-false}")
ssh_registry_host: $(quote_yaml_value "$(resolved_ssh_registry_host)")
ssh_registry_port: $(quote_yaml_value "$(resolved_ssh_registry_port)")
ssh_registry_image_ref: $(quote_yaml_value "$(resolved_ssh_registry_server_image_ref)")
traefik_container_name: 'puppetmaster2-traefik'
traefik_image: $(quote_yaml_value "${TRAEFIK_IMAGE:-$(default_traefik_image)}")
letsencrypt_dir: '/letsencrypt'
release_state_dir: $(quote_yaml_value "/home/$deploy_user/app/releases")
EOF
  } >"$output_file"

  chmod 600 "$output_file"
}

render_ansible_inventory_file() {
  local output_file="$1"
  local server_ip="$2"
  local deploy_auth_mode="$3"
  local deploy_user_password="$4"
  local deploy_ssh_key="$5"
  local deploy_ssh_key_pub="$6"
  local known_hosts_file="$7"
  local deploy_user

  deploy_user="$(resolved_deploy_user)"

  ensure_restricted_file "$output_file"

  {
    cat <<EOF
all:
  vars:
    ansible_python_interpreter: /usr/bin/python3
    ansible_user: $(quote_yaml_value "$deploy_user")
    deploy_user: $(quote_yaml_value "$deploy_user")
    ansible_ssh_common_args: $(quote_yaml_value "-o StrictHostKeyChecking=yes -o UserKnownHostsFile=$known_hosts_file")
EOF

    case "$deploy_auth_mode" in
      password)
        cat <<EOF
    ansible_password: $(quote_yaml_value "$deploy_user_password")
EOF
        ;;
      ssh_key)
        cat <<EOF
    ansible_ssh_private_key_file: $(quote_yaml_value "$deploy_ssh_key")
EOF
        ;;
    esac

    if [[ -n "$deploy_ssh_key_pub" ]]; then
      cat <<EOF
    deploy_user_ssh_key: "{{ lookup('file', '$(printf "%s" "$deploy_ssh_key_pub")') }}"
EOF
    fi

    cat <<EOF

  children:
    production:
      hosts:
        prod-1:
          ansible_host: $(quote_yaml_value "$server_ip")
EOF
  } >"$output_file"

  chmod 600 "$output_file"
}

render_ansible_runtime_vars_file() {
  local output_file="$1"
  local deploy_user_password="$2"

  ensure_restricted_file "$output_file"

  {
    cat <<EOF
ansible_become_password: $(quote_yaml_value "$deploy_user_password")
EOF
  } >"$output_file"

  chmod 600 "$output_file"
}
