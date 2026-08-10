#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PM_LOCAL_ENV:-$ROOT_DIR/.env}"

# shellcheck source=./lib/deploy-env.sh
source "$ROOT_DIR/scripts/lib/deploy-env.sh"

DOCKER_TOKEN_INPUT="${PM_DOCKER_TOKEN:-}"
DOCKER_IMAGE_INPUT=''
DOCKER_USERNAME_INPUT=''
SERVER_IP_INPUT=''
SITE_DOMAIN_INPUT=''
ACME_EMAIL_INPUT=''
DEPLOY_USER_INPUT=''

log() {
  printf '[deploy-secrets] %s\n' "$*"
}

warn() {
  printf '[deploy-secrets] WARNING: %s\n' "$*" >&2
}

fail() {
  printf '[deploy-secrets] ERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Usage: npm run deploy:secrets -- [options]

Generates and fills the Docker-first deploy secret contract in .env.

Options:
  --docker-token TOKEN         Write PM_DOCKER_TOKEN. Prefer PM_DOCKER_TOKEN env over CLI history.
  --docker-image IMAGE         Set PM_DOCKER_IMAGE, for example registry.example.com/org/app.
  --docker-username USER       Set PM_DOCKER_USERNAME.
  --server-ip IP              Set SERVER_IP.
  --site-domain DOMAIN         Set SITE_DOMAIN.
  --acme-email EMAIL          Set ACME_EMAIL.
  --deploy-user USER          Set DEPLOY_USER. Default: deploy.
  --help                      Show this help.
EOF
}

upsert_env() {
  local key="$1"
  local value="$2"
  local tmp rendered line trimmed updated=0

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

is_missing_or_placeholder() {
  local value="$1"
  shift

  [[ -z "$value" ]] && return 0

  local placeholder
  for placeholder in "$@"; do
    [[ "$value" == "$placeholder" ]] && return 0
  done

  return 1
}

require_secret_tooling() {
  command -v openssl >/dev/null 2>&1 || fail "openssl is required to generate deploy secrets."
}

derive_docker_image() {
  printf '%s' "${PM_APP_CONTAINER_NAME:-pm-app}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --docker-token)
      [[ $# -ge 2 ]] || fail "--docker-token requires a value."
      DOCKER_TOKEN_INPUT="$2"
      shift 2
      ;;
    --docker-image)
      [[ $# -ge 2 ]] || fail "--docker-image requires a value."
      DOCKER_IMAGE_INPUT="$2"
      shift 2
      ;;
    --docker-username)
      [[ $# -ge 2 ]] || fail "--docker-username requires a value."
      DOCKER_USERNAME_INPUT="$2"
      shift 2
      ;;
    --server-ip)
      [[ $# -ge 2 ]] || fail "--server-ip requires a value."
      SERVER_IP_INPUT="$2"
      shift 2
      ;;
    --site-domain)
      [[ $# -ge 2 ]] || fail "--site-domain requires a value."
      SITE_DOMAIN_INPUT="$2"
      shift 2
      ;;
    --acme-email)
      [[ $# -ge 2 ]] || fail "--acme-email requires a value."
      ACME_EMAIL_INPUT="$2"
      shift 2
      ;;
    --deploy-user)
      [[ $# -ge 2 ]] || fail "--deploy-user requires a value."
      DEPLOY_USER_INPUT="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail "Unknown option: $1"
      ;;
  esac
done

require_secret_tooling

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  log "Created .env from .env.example."
fi

load_dotenv_file "$ENV_FILE"

[[ -n "$DOCKER_IMAGE_INPUT" ]] && PM_DOCKER_IMAGE="$DOCKER_IMAGE_INPUT"
[[ -n "$DOCKER_USERNAME_INPUT" ]] && PM_DOCKER_USERNAME="$DOCKER_USERNAME_INPUT"
[[ -n "$SERVER_IP_INPUT" ]] && SERVER_IP="$SERVER_IP_INPUT"
[[ -n "$SITE_DOMAIN_INPUT" ]] && SITE_DOMAIN="$SITE_DOMAIN_INPUT"
[[ -n "$ACME_EMAIL_INPUT" ]] && ACME_EMAIL="$ACME_EMAIL_INPUT"
[[ -n "$DEPLOY_USER_INPUT" ]] && DEPLOY_USER="$DEPLOY_USER_INPUT"

APP_VERSION="${APP_VERSION:-0.1.0}"
SSH_KEY="${SSH_KEY:-true}"
PM_DEPLOY_AUTH_MODE="${PM_DEPLOY_AUTH_MODE:-ssh_key}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DATABASE_URL="${DATABASE_URL:-./data/sqlite.db}"
PM_DEPLOY_DATABASE_URL="${PM_DEPLOY_DATABASE_URL:-/app/data/sqlite.db}"
PM_DOCKER_DEPLOY_MODE="${PM_DOCKER_DEPLOY_MODE:-ssh-registry}"
PM_DOCKER_REGISTRY="${PM_DOCKER_REGISTRY:-}"
PM_APP_CONTAINER_NAME="${PM_APP_CONTAINER_NAME:-pm-app}"
PM_APP_NETWORK="${PM_APP_NETWORK:-pm-shared}"
PM_DOCKER_STREAM_COMPRESSION="${PM_DOCKER_STREAM_COMPRESSION:-zstd}"
TRAEFIK_IMAGE="${TRAEFIK_IMAGE:-$(default_traefik_image)}"

if is_missing_or_placeholder "${DEPLOY_USER_PASSWORD:-}" "deploy-user-password" "your-deploy-password"; then
  DEPLOY_USER_PASSWORD="$(openssl rand -base64 24)"
  log "Generated DEPLOY_USER_PASSWORD."
fi

if is_missing_or_placeholder "${PM_SETTINGS_ENCRYPTION_KEY:-}" "$PM_SETTINGS_ENCRYPTION_KEY_PLACEHOLDER" "<literal-64-char-hex-secret>"; then
  PM_SETTINGS_ENCRYPTION_KEY="$(openssl rand -hex 32)"
  log "Generated PM_SETTINGS_ENCRYPTION_KEY."
fi

# TOTP_ENCRYPTION_KEY encrypts 2FA secrets at rest (required when
# FEATURES.twoFactorAuth is enabled — the server fails fast without it).
if is_missing_or_placeholder "${TOTP_ENCRYPTION_KEY:-}" "$TOTP_ENCRYPTION_KEY_PLACEHOLDER" "<literal-64-char-hex-secret>"; then
  TOTP_ENCRYPTION_KEY="$(openssl rand -hex 32)"
  log "Generated TOTP_ENCRYPTION_KEY."
fi

if is_missing_or_placeholder "${PM_DOCKER_IMAGE:-}" "registry.example.com/your-org/your-puppet-master-app"; then
  PM_DOCKER_IMAGE="$(derive_docker_image)"
  log "Set PM_DOCKER_IMAGE to $PM_DOCKER_IMAGE."
fi

if is_missing_or_placeholder "${PM_DOCKER_USERNAME:-}" "your-registry-user"; then
  PM_DOCKER_USERNAME=''
fi

if [[ -n "$DOCKER_TOKEN_INPUT" ]]; then
  PM_DOCKER_TOKEN="$DOCKER_TOKEN_INPUT"
  log "Stored PM_DOCKER_TOKEN from provided input."
elif [[ "${PM_DOCKER_DEPLOY_MODE:-ssh-registry}" == "registry" ]] && is_missing_or_placeholder "${PM_DOCKER_TOKEN:-}" "your-registry-token"; then
  warn "PM_DOCKER_TOKEN is still missing. Create a registry token with package write access and rerun with PM_DOCKER_TOKEN=... npm run deploy:secrets."
  PM_DOCKER_TOKEN=''
fi

upsert_env APP_VERSION "$APP_VERSION"
[[ -n "${SERVER_IP:-}" ]] && upsert_env SERVER_IP "$SERVER_IP"
[[ -n "${SITE_DOMAIN:-}" ]] && upsert_env SITE_DOMAIN "$SITE_DOMAIN"
[[ -n "${ACME_EMAIL:-}" ]] && upsert_env ACME_EMAIL "$ACME_EMAIL"
upsert_env SSH_KEY "$SSH_KEY"
upsert_env PM_DEPLOY_AUTH_MODE "$PM_DEPLOY_AUTH_MODE"
upsert_env DEPLOY_USER "$DEPLOY_USER"
upsert_env DEPLOY_USER_PASSWORD "$DEPLOY_USER_PASSWORD"
upsert_env DATABASE_URL "$DATABASE_URL"
upsert_env PM_DEPLOY_DATABASE_URL "$PM_DEPLOY_DATABASE_URL"
upsert_env PM_SETTINGS_ENCRYPTION_KEY "$PM_SETTINGS_ENCRYPTION_KEY"
upsert_env TOTP_ENCRYPTION_KEY "$TOTP_ENCRYPTION_KEY"
upsert_env PM_DOCKER_DEPLOY_MODE "$PM_DOCKER_DEPLOY_MODE"
upsert_env PM_DOCKER_REGISTRY "$PM_DOCKER_REGISTRY"
upsert_env PM_DOCKER_IMAGE "$PM_DOCKER_IMAGE"
upsert_env PM_DOCKER_USERNAME "$PM_DOCKER_USERNAME"
upsert_env PM_DOCKER_TOKEN "${PM_DOCKER_TOKEN:-}"
upsert_env PM_DOCKER_STREAM_COMPRESSION "$PM_DOCKER_STREAM_COMPRESSION"
upsert_env PM_APP_CONTAINER_NAME "$PM_APP_CONTAINER_NAME"
upsert_env PM_APP_NETWORK "$PM_APP_NETWORK"
upsert_env TRAEFIK_IMAGE "$TRAEFIK_IMAGE"

log "Deploy secret contract updated in $ENV_FILE."
log "Next: fill SERVER_IP, SITE_DOMAIN, ACME_EMAIL, and DEPLOY_SSH_KEY if they are not already set."
log "PM_DOCKER_TOKEN is only needed when PM_DOCKER_DEPLOY_MODE=registry."
log "Default deploy mode is ssh-registry: private server registry over an SSH tunnel, no third-party registry."
