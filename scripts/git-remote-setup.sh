#!/usr/bin/env bash
# ─── Git Remote Setup — adds all enabled remotes ──────────────────────────
# Usage: ./scripts/git-remote-setup.sh

set -euo pipefail

echo "Setting up Git remotes..."

# Edit these to match your project remotes
remotes=(
  "github git@github.com:user/project.git"
  "gitflic git@gitflic.ru:user/project.git"
)

for remote in "${remotes[@]}"; do
  name=$(echo "$remote" | cut -d' ' -f1)
  url=$(echo "$remote" | cut -d' ' -f2)

  if git remote get-url "$name" &>/dev/null; then
    echo "  ⚠️  Remote '$name' already exists — updating URL"
    git remote set-url "$name" "$url"
  else
    echo "  ➕ Adding remote '$name' → $url"
    git remote add "$name" "$url"
  fi
done

echo "✅ Remotes configured. Run: git remote -v"
git remote -v
