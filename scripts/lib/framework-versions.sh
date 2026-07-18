#!/usr/bin/env bash

FRAMEWORK_NODE_IMAGE_FALLBACK='node:22-alpine3.22'
FRAMEWORK_TRAEFIK_IMAGE_FALLBACK='traefik:v3.1'

framework_versions_root_dir() {
  if [[ -n "${ROOT_DIR:-}" ]]; then
    printf '%s\n' "$ROOT_DIR"
    return
  fi

  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

framework_manifest_value() {
  local key_path="$1"
  local fallback="$2"
  local root_dir manifest_file

  root_dir="$(framework_versions_root_dir)"
  manifest_file="$root_dir/framework.versions.json"

  if [[ ! -f "$manifest_file" ]] || ! command -v node >/dev/null 2>&1; then
    printf '%s' "$fallback"
    return
  fi

  node -e '
    const fs = require("node:fs")
    const [file, path, fallback] = process.argv.slice(1)
    try {
      const manifest = JSON.parse(fs.readFileSync(file, "utf8"))
      const value = path.split(".").reduce((current, key) => current?.[key], manifest)
      process.stdout.write(typeof value === "string" && value.length > 0 ? value : fallback)
    } catch {
      process.stdout.write(fallback)
    }
  ' "$manifest_file" "$key_path" "$fallback"
}

default_node_image() {
  framework_manifest_value "runtime.nodeImage" "$FRAMEWORK_NODE_IMAGE_FALLBACK"
}

default_traefik_image() {
  framework_manifest_value "runtime.traefikImage" "$FRAMEWORK_TRAEFIK_IMAGE_FALLBACK"
}
