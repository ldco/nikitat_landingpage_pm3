#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() {
  printf '[deploy-artifacts] ERROR: %s\n' "$*" >&2
  exit 1
}

check_not_tracked() {
  local file="$1"

  if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
    fail "$file is tracked by git. Generated deploy artifacts must stay local-only and ignored."
  fi
}

check_inventory_file() {
  local file='ansible/inventory.yml'

  check_not_tracked "$file"
  [[ -f "$file" ]] || return 0
  fail "$file exists in the workspace. Generated inventory must stay local-only and must not enter CI."
}

check_deploy_vars_file() {
  local file='ansible/deploy-vars.yml'

  check_not_tracked "$file"
  [[ -f "$file" ]] || return 0
  fail "$file exists in the workspace. Rotate any exposed secrets and keep generated deploy vars local-only."
}

check_inventory_file
check_deploy_vars_file

printf '[deploy-artifacts] Generated deploy artifact guard passed.\n'
