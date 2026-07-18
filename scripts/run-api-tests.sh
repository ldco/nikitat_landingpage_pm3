#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

per_file_timeout="${API_TEST_FILE_TIMEOUT_SECONDS:-120}"

mapfile -t test_files < <(find tests/api -maxdepth 1 -type f -name '*.test.ts' | LC_ALL=C sort)

if [ "${#test_files[@]}" -eq 0 ]; then
  echo "[test:api] No API test files found in tests/api" >&2
  exit 1
fi

failures=()

for file in "${test_files[@]}"; do
  echo
  echo "[test:api] Running ${file} (timeout: ${per_file_timeout}s)"

  if timeout --foreground --kill-after=10s "${per_file_timeout}s" npm run test:run -- "$file" "$@"; then
    :
  else
    status=$?
    if [ "$status" -eq 124 ] || [ "$status" -eq 137 ]; then
      echo "[test:api] ${file} timed out after ${per_file_timeout}s" >&2
    fi
    failures+=("$file")
  fi
done

if [ "${#failures[@]}" -gt 0 ]; then
  echo
  echo "[test:api] Failed files (${#failures[@]}):" >&2
  for file in "${failures[@]}"; do
    echo " - ${file}" >&2
  done
  exit 1
fi

echo
echo "[test:api] All ${#test_files[@]} API test files passed."
