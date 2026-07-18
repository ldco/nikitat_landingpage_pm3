#!/usr/bin/env bash
# ==============================================================================
# PM TRAEFIK CONFIG — Composite Traefik config generator for shared VPS
# ==============================================================================
# Regenerates the unified Traefik dynamic config that includes ALL projects
# deployed on a shared VPS. Reads deploy metadata from stack directories.
#
# Reads SSH connection info from environment (set by deploy.sh / .env):
#   SERVER_IP, DEPLOY_USER, PM_DEPLOY_AUTH_MODE, DEPLOY_SSH_KEY, DEPLOY_USER_PASSWORD
#
# Usage (called from deploy.sh, not standalone):
#   bash scripts/pm-traefik-config.sh
# ==============================================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SERVER_IP="${SERVER_IP:-}"
DEPLOY_USER="${DEPLOY_USER_NAME:-${DEPLOY_USER:-deploy}}"
DEPLOY_AUTH_MODE="${PM_DEPLOY_AUTH_MODE:-ssh_key}"
DEPLOY_SSH_KEY="${DEPLOY_SSH_KEY:-}"
DEPLOY_USER_PASSWORD="${DEPLOY_USER_PASSWORD:-}"
DEPLOY_KNOWN_HOSTS_FILE="${DEPLOY_KNOWN_HOSTS_FILE:-}"

[[ -n "$SERVER_IP" ]] || { echo "[pm-traefik-config] SERVER_IP is required."; exit 1; }

build_ssh_cmd() {
  local kh_args=(-o StrictHostKeyChecking=yes)
  if [[ -n "$DEPLOY_KNOWN_HOSTS_FILE" ]]; then
    kh_args+=(-o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS_FILE")
  fi

  if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" && -n "$DEPLOY_SSH_KEY" ]]; then
    echo "ssh -i $DEPLOY_SSH_KEY ${kh_args[*]} $DEPLOY_USER@$SERVER_IP"
  elif [[ -n "$DEPLOY_USER_PASSWORD" ]]; then
    echo "sshpass -p $DEPLOY_USER_PASSWORD ssh ${kh_args[*]} -o PreferredAuthentications=password $DEPLOY_USER@$SERVER_IP"
  else
    echo "[pm-traefik-config] Cannot resolve SSH credentials. Set DEPLOY_SSH_KEY or DEPLOY_USER_PASSWORD." >&2
    exit 1
  fi
}

SSH_CMD="$(build_ssh_cmd)"

TMP_SCRIPT="$(mktemp)"
cat > "$TMP_SCRIPT" <<'SCRIPTEOF'
#!/usr/bin/env bash
set -euo pipefail

STACKS_DIR="${HOME}/app/stacks"
TRAEFIK_FILE="${HOME}/app/traefik/dynamic/pm-projects.yml"

mkdir -p "$(dirname "$TRAEFIK_FILE")"

{
  printf '# PuppetMaster shared Traefik configuration\n'
  printf '# Auto-generated: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '# Managed by pm-deploy. DO NOT EDIT MANUALLY.\n'
  printf 'http:\n'
  printf '  routers:\n'
} > "$TRAEFIK_FILE"

HAS_MIDDLEWARES='false'
MIDDLEWARES_BLOCK=""

for deploy_json in "$STACKS_DIR"/*/.pm-deploy.json; do
  [ -f "$deploy_json" ] || continue
  domain=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).domain)" "$deploy_json")
  project_id=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).projectId)" "$deploy_json")
  alias_regex=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).traefikAliasRedirectRegex || '')" "$deploy_json")
  alias_replacement=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).traefikAliasRedirectReplacement || '')" "$deploy_json")
  [ -n "$domain" ] || continue
  [ -n "$project_id" ] || continue
  {
    printf '    %s:\n' "$project_id"
    printf '      rule: "Host(`%s`)"\n' "$domain"
    printf '      entryPoints:\n'
    printf '        - websecure\n'
    printf '      service: %s\n' "$project_id"
    printf '      tls:\n'
    printf '        certResolver: letsencrypt\n'
    if [ -n "$alias_regex" ] && [ -n "$alias_replacement" ]; then
      printf '      middlewares:\n'
      printf '        - %s-canonical-redirect\n' "$project_id"
    fi
  } >> "$TRAEFIK_FILE"

  if [ -n "$alias_regex" ] && [ -n "$alias_replacement" ]; then
    HAS_MIDDLEWARES='true'
    MIDDLEWARES_BLOCK+=$(cat <<MIDDLEWARE

    ${project_id}-canonical-redirect:
      redirectRegex:
        regex: '${alias_regex}'
        replacement: '${alias_replacement}'
        permanent: true
MIDDLEWARE
)
  fi
done

if [ "$HAS_MIDDLEWARES" = 'true' ]; then
  {
    printf '  middlewares:\n'
    printf '%s\n' "$MIDDLEWARES_BLOCK"
  } >> "$TRAEFIK_FILE"
fi

{
  printf '  services:\n'
} >> "$TRAEFIK_FILE"

for deploy_json in "$STACKS_DIR"/*/.pm-deploy.json; do
  [ -f "$deploy_json" ] || continue
  project_id=$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).projectId)" "$deploy_json")
  [ -n "$project_id" ] || continue
  {
    printf '    %s:\n' "$project_id"
    printf '      loadBalancer:\n'
    printf '        servers:\n'
    printf '          - url: "http://pm-%s-app:3000"\n' "$project_id"
  } >> "$TRAEFIK_FILE"
done

project_count=$(ls -1d "$STACKS_DIR"/*/ 2>/dev/null | wc -l)
echo "[pm-traefik-config] Regenerated Traefik config with $project_count project(s)."
SCRIPTEOF

chmod +x "$TMP_SCRIPT"
$SSH_CMD bash -s < "$TMP_SCRIPT"
rm -f "$TMP_SCRIPT"
