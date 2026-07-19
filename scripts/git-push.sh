#!/usr/bin/env bash
# ─── Git Push to All Remotes ───────────────────────────────────────────────
# Usage: ./scripts/git-push.sh [branch]

set -euo pipefail

branch="${1:-$(git branch --show-current)}"

echo "🚀 Pushing branch '$branch' to all remotes..."

git remote | while IFS= read -r remote; do
  echo "  → $remote ($branch)"
  git push "$remote" "$branch" 2>&1 | sed 's/^/    /'
done

echo "✅ Push complete"
