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
  upsert_env_file "$ENV_FILE" "$1" "$2"
}

require_secret_tooling() {
  command -v openssl >/dev/null 2>&1 || fail "openssl is required to generate deploy secrets."
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

# Framework-level contract: create .env when missing (from .env.example or a
# framework skeleton), auto-generate all framework-managed secrets and deploy
# transport defaults. See ensure_framework_env in scripts/lib/deploy-env.sh.
ensure_framework_env "$ENV_FILE" "$ROOT_DIR/.env.example"

# Apply CLI-provided overrides on top of the managed contract.
[[ -n "$DOCKER_IMAGE_INPUT" ]] && upsert_env PM_DOCKER_IMAGE "$DOCKER_IMAGE_INPUT"
[[ -n "$DOCKER_USERNAME_INPUT" ]] && upsert_env PM_DOCKER_USERNAME "$DOCKER_USERNAME_INPUT"
[[ -n "$SERVER_IP_INPUT" ]] && upsert_env SERVER_IP "$SERVER_IP_INPUT"
[[ -n "$SITE_DOMAIN_INPUT" ]] && upsert_env SITE_DOMAIN "$SITE_DOMAIN_INPUT"
[[ -n "$ACME_EMAIL_INPUT" ]] && upsert_env ACME_EMAIL "$ACME_EMAIL_INPUT"
[[ -n "$DEPLOY_USER_INPUT" ]] && upsert_env DEPLOY_USER "$DEPLOY_USER_INPUT"

# The registry token is the only value that cannot be generated and is only
# required in registry mode.
load_dotenv_file "$ENV_FILE"
if [[ -n "$DOCKER_TOKEN_INPUT" ]]; then
  upsert_env PM_DOCKER_TOKEN "$DOCKER_TOKEN_INPUT"
  log "Stored PM_DOCKER_TOKEN from provided input."
elif [[ "${PM_DOCKER_DEPLOY_MODE:-ssh-registry}" == "registry" ]] && is_missing_or_placeholder "${PM_DOCKER_TOKEN:-}" "your-registry-token"; then
  warn "PM_DOCKER_TOKEN is still missing. Create a registry token with package write access and rerun with PM_DOCKER_TOKEN=... npm run deploy:secrets."
fi

log "Deploy secret contract updated in $ENV_FILE."
log "All deploy secrets are auto-generated. Only your site facts are operator-provided:"
log "SERVER_IP, SITE_DOMAIN, ACME_EMAIL (plus SERVER_ROOT_PASSWORD for the first-time"
log "password bootstrap) and DEPLOY_SSH_KEY when SSH_KEY=true and it is not already set."
log "PM_DOCKER_TOKEN is only needed when PM_DOCKER_DEPLOY_MODE=registry."
log "Default deploy mode is ssh-registry: private server registry over an SSH tunnel, no third-party registry."
