#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# pm-new-project — Bootstrap a greenfield Puppet Master project
# ═══════════════════════════════════════════════════════════════════════════════
#
# Usage:
#   bash scripts/pm-new-project.sh /path/to/new-project
#   bash scripts/pm-new-project.sh /path/to/new-project --name="My Project"
#
# What it does:
#   1. Copies the PM framework (this directory) to the target
#   2. Strips project-layer residue (data, generated caches, old logs)
#   3. Resets pmMode to 'unconfigured' and PM_MODE in .env
#   4. Removes local databases
#   5. Creates a clean git-ready workspace
#
# What it KEEPS (framework core):
#   - pm-core/, server/utils/, app/components/(atoms,molecules,organisms)
#   - app/composables/, app/assets/css/, i18n/system.*
#   - app/pages/admin/, server/api/, Dockerfile, scripts/, ansible/
#   - project/init/ prompts, docs/, framework.versions.json
#
# What it STRIPS (needs project-specific replacement):
#   - data/*.db
#   - .nuxt/, node_modules/
#   - Generated logs, reports, backups
#   - project-layer config, content seed, public assets
#
# After running, cd into the target and:
#   1. npm install
#   2. cp .env.example .env
#   3. npm run dev
#   4. Open http://localhost:3000/init
# ═══════════════════════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

log_info()  { printf "${CYAN}•${NC} %s\n" "$*"; }
log_ok()    { printf "${GREEN}✓${NC} %s\n" "$*"; }
log_error() { printf "${RED}✗${NC} %s\n" "$*" >&2; }

# ── Parse args ────────────────────────────────────────────────────────────────

TARGET=""
PROJECT_NAME=""
SOURCE="$(cd "$(dirname "$0")/.." && pwd)"

for arg in "$@"; do
  case "$arg" in
    --name=*) PROJECT_NAME="${arg#--name=}" ;;
    --name)   shift; PROJECT_NAME="$1" ;;
    --help|-h)
      echo "Usage: pm-new-project.sh <target-path> [--name=\"Project Name\"]"
      echo ""
      echo "  Bootstrap a greenfield Puppet Master project from the framework baseline."
      echo "  The target directory must not exist."
      exit 0
      ;;
    *) TARGET="$arg" ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  log_error "Target path required."
  echo "  Usage: bash scripts/pm-new-project.sh /path/to/new-project [--name=\"My Project\"]"
  exit 1
fi

TARGET="$(realpath -m "$TARGET")"

if [[ -e "$TARGET" ]]; then
  log_error "Target already exists: $TARGET"
  echo "  Remove it first or choose a different path."
  exit 1
fi

if [[ ! -f "$SOURCE/project/puppet-master.config.ts" ]]; then
  log_error "Not a Puppet Master project root: $SOURCE"
  exit 1
fi

# ── Copy framework ────────────────────────────────────────────────────────────

log_info "Source:  ${SOURCE}"
log_info "Target:  ${TARGET}"

mkdir -p "$TARGET"

# rsync with explicit exclude list — keeps framework, strips runtime artifacts
rsync -a \
  --exclude='.git' \
  --exclude='.nuxt' \
  --exclude='.nuxt-old' \
  --exclude='.nuxt-root' \
  --exclude='.output' \
  --exclude='node_modules' \
  --exclude='node_modules/' \
  --exclude='data/*.db' \
  --exclude='data/*.db-wal' \
  --exclude='data/*.db-shm' \
  --exclude='.deploy' \
  --exclude='playwright-report' \
  --exclude='test-results' \
  --exclude='uploads' \
  --exclude='*.log' \
  --exclude='lighthouse-report.json' \
  --exclude='.env' \
  --exclude='**/generated/' \
  --exclude='.claude-data' \
  --exclude='.claude-monitor' \
  --exclude='.qwen-data' \
  --exclude='.qwen' \
  --exclude='.kilo' \
  --exclude='.codex' \
  --exclude='.gemini' \
  --exclude='.idea' \
  --exclude='.vscode' \
  --exclude='*.backup.*' \
  "$SOURCE/" "$TARGET/"

log_ok "Framework copied"

# ── Ensure data/ exists ──────────────────────────────────────────────────────

mkdir -p "$TARGET/data"
touch "$TARGET/data/.gitkeep"

# ── Reset to unconfigured ─────────────────────────────────────────────────────

CONFIG="$TARGET/project/puppet-master.config.ts"

if [[ -f "$CONFIG" ]]; then
  # Set pmMode to unconfigured
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' "s/pmMode: *'[^']*'/pmMode: 'unconfigured'/" "$CONFIG"
  else
    sed -i "s/pmMode: *'[^']*'/pmMode: 'unconfigured'/" "$CONFIG"
  fi
  log_ok "pmMode set to 'unconfigured'"
fi

# ── Create .env from example ─────────────────────────────────────────────────

if [[ -f "$TARGET/.env.example" ]]; then
  cp "$TARGET/.env.example" "$TARGET/.env"
  log_ok ".env created from .env.example"
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""
printf "${BOLD}${GREEN}Greenfield project ready at:${NC}\n"
echo "  ${TARGET}"
echo ""

if [[ -n "$PROJECT_NAME" ]]; then
  echo "Project name: ${PROJECT_NAME}"
  echo ""
fi

echo "${BOLD}Next steps:${NC}"
echo "  1. cd ${TARGET}"
echo "  2. npm install"
echo "  3. npm run dev"
echo "  4. Open http://localhost:3000/init"
echo "  5. Run the wizard to configure your project"
echo ""
echo "Or use prompt-driven setup:"
echo "  - Fill out project/init/GREENFIELD_PROJECT_START_PROMPT.md"
echo "  - Add concept docs to project/init/concept_docs/"
echo "  - Run: npm run pm-init-green -- --agent=codex"
echo "  - Give the generated bundle to your AI agent"
