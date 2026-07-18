#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck source=./lib/framework-versions.sh
source "$ROOT_DIR/scripts/lib/framework-versions.sh"

IMAGE_NAME="${PM_DOCKER_DEV_IMAGE:-puppetmaster2-dev}"
CONTAINER_NAME="${PM_DOCKER_DEV_CONTAINER:-puppetmaster2-dev}"
PORT_VALUE="${PORT:-3000}"
HOST_PORT_EXPLICIT="${PM_DOCKER_DEV_HOST_PORT+x}"

USER_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      if [[ -n "${2:-}" && "$2" =~ ^[0-9]+$ ]]; then
        PORT_VALUE="$2"
        HOST_PORT_EXPLICIT="x"
        shift 2
      else
        printf '[docker-dev] ERROR: --port requires a numeric argument.\n' >&2
        exit 1
      fi
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        PORT_VALUE="$1"
        HOST_PORT_EXPLICIT="x"
        shift
      else
        USER_ARGS+=("$1")
        shift
      fi
      ;;
  esac
done
set -- "${USER_ARGS[@]}"

HOST_PORT="${PM_DOCKER_DEV_HOST_PORT:-$PORT_VALUE}"
ENV_FILE="${PM_DOCKER_DEV_ENV_FILE:-$ROOT_DIR/.env}"
LOCKFILE="$ROOT_DIR/package-lock.json"

lockfile_fingerprint() {
  if [[ ! -f "$LOCKFILE" ]]; then
    printf 'no-lockfile'
    return
  fi

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$LOCKFILE" | awk '{ print substr($1, 1, 16) }'
    return
  fi

  shasum -a 256 "$LOCKFILE" | awk '{ print substr($1, 1, 16) }'
}

dotenv_has_key() {
  local key="$1"
  local line raw parsed_key

  [[ -f "$ENV_FILE" ]] || return 1

  while IFS= read -r line || [[ -n "$line" ]]; do
    raw="${line%$'\r'}"
    raw="${raw#"${raw%%[![:space:]]*}"}"
    raw="${raw%"${raw##*[![:space:]]}"}"

    [[ -z "$raw" ]] && continue
    [[ "${raw:0:1}" == "#" ]] && continue

    if [[ "$raw" == export[[:space:]]* ]]; then
      raw="${raw#export}"
      raw="${raw#"${raw%%[![:space:]]*}"}"
    fi

    [[ "$raw" == *=* ]] || continue
    parsed_key="${raw%%=*}"
    parsed_key="${parsed_key%"${parsed_key##*[![:space:]]}"}"

    if [[ "$parsed_key" == "$key" ]]; then
      return 0
    fi
  done <"$ENV_FILE"

  return 1
}

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

append_env_file_args() {
  local line raw key value

  [[ -f "$ENV_FILE" ]] || return 0

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
    docker_args+=(-e "$key=$value")
  done <"$ENV_FILE"
}

log() {
  printf '[docker-dev] %s\n' "$*"
}

docker_image_exists() {
  docker image inspect "$IMAGE_NAME" >/dev/null 2>&1
}

docker_volume_exists() {
  local volume="$1"
  docker volume inspect "$volume" >/dev/null 2>&1
}

initialize_dependency_volume_from_host() {
  if [[ ! -x "$ROOT_DIR/node_modules/.bin/nuxt" ]]; then
    return 1
  fi

  log "Initializing dependency volume $NODE_MODULES_VOLUME from local node_modules."
  docker run --rm \
    -v "$ROOT_DIR/node_modules:/host_node_modules:ro" \
    -v "$ROOT_DIR:/app" \
    -v "$NODE_MODULES_VOLUME:/app/node_modules" \
    "$IMAGE_NAME" \
    sh -lc 'cp -a /host_node_modules/. /app/node_modules/ && cd /app && npm rebuild better-sqlite3 --loglevel=error'
}

host_port_in_use() {
  local port="$1"

  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$port" | awk 'NR > 1 { found = 1 } END { exit found ? 0 : 1 }'
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1
    return
  fi

  timeout 1 bash -c ":</dev/tcp/127.0.0.1/$port" >/dev/null 2>&1
}

resolve_host_port() {
  local port="$1"
  local candidate

  if ! host_port_in_use "$port"; then
    printf '%s' "$port"
    return
  fi

  if [[ -n "$HOST_PORT_EXPLICIT" ]]; then
    printf '[docker-dev] ERROR: requested host port %s is already in use.\n' "$port" >&2
    printf '[docker-dev] Choose another port, for example: PM_DOCKER_DEV_HOST_PORT=3003 npm run dev\n' >&2
    exit 1
  fi

  for candidate in $(seq "$((port + 1))" "$((port + 20))"); do
    if ! host_port_in_use "$candidate"; then
      printf '[docker-dev] Host port %s is busy; using http://localhost:%s instead.\n' "$port" "$candidate" >&2
      printf '%s' "$candidate"
      return
    fi
  done

  printf '[docker-dev] ERROR: no free host port found in range %s-%s.\n' "$port" "$((port + 20))" >&2
  printf '[docker-dev] Set PM_DOCKER_DEV_HOST_PORT to a free port and retry.\n' >&2
  exit 1
}

cleanup_dependency_volumes() {
  local volume

  log "Removing orphaned dependency volumes for $CONTAINER_NAME."
  while IFS= read -r volume; do
    [[ -n "$volume" ]] || continue
    docker volume rm "$volume" >/dev/null || true
  done < <(docker volume ls --format '{{.Name}}' | grep -E "^${CONTAINER_NAME}-node-modules(-|$)" || true)
}

if ! command -v docker >/dev/null 2>&1; then
  printf '[docker-dev] ERROR: Docker is required for npm run dev.\n' >&2
  exit 1
fi

if [[ "${1:-}" == "--clean-volumes" ]]; then
  cleanup_dependency_volumes
  exit 0
fi

mkdir -p "$ROOT_DIR/data" "$ROOT_DIR/uploads"

LOCK_HASH="$(lockfile_fingerprint)"
NODE_MODULES_VOLUME="${CONTAINER_NAME}-node-modules-$LOCK_HASH"
NUXT_VOLUME="${CONTAINER_NAME}-nuxt"
BUILD_MODE="${PM_DOCKER_DEV_BUILD:-auto}"

if [[ "${PM_DOCKER_DEV_SKIP_BUILD:-false}" == "true" ]]; then
  log "Skipping image build because PM_DOCKER_DEV_SKIP_BUILD=true."
elif [[ "$BUILD_MODE" == "always" ]]; then
  log "Building development image $IMAGE_NAME because PM_DOCKER_DEV_BUILD=always."
  docker build --build-arg "PM_NODE_IMAGE=${PM_NODE_IMAGE:-$(default_node_image)}" --target development -t "$IMAGE_NAME" "$ROOT_DIR"
  docker image prune -f --filter "dangling=true" 2>/dev/null || true
elif [[ "$BUILD_MODE" == "auto" ]]; then
  if docker_image_exists && docker_volume_exists "$NODE_MODULES_VOLUME"; then
    log "Using cached development image and dependency volume for lockfile $LOCK_HASH."
  elif docker_image_exists && initialize_dependency_volume_from_host; then
    log "Using cached development image with dependency volume initialized from host for lockfile $LOCK_HASH."
  else
    log "Building development image $IMAGE_NAME for lockfile $LOCK_HASH."
    docker build --build-arg "PM_NODE_IMAGE=${PM_NODE_IMAGE:-$(default_node_image)}" --target development -t "$IMAGE_NAME" "$ROOT_DIR"
    docker image prune -f --filter "dangling=true" 2>/dev/null || true
  fi
else
  printf '[docker-dev] ERROR: PM_DOCKER_DEV_BUILD must be auto or always.\n' >&2
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -Fxq "$CONTAINER_NAME"; then
  log "Replacing existing container $CONTAINER_NAME."
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

HOST_PORT="$(resolve_host_port "$HOST_PORT")"

docker_args=(
  run
  --rm
  --name "$CONTAINER_NAME"
  -p "$HOST_PORT:$PORT_VALUE"
  -e "HOST=0.0.0.0"
  -e "PORT=$PORT_VALUE"
  -v "$ROOT_DIR:/app"
  -v "$NODE_MODULES_VOLUME:/app/node_modules"
  -v "$NUXT_VOLUME:/app/.nuxt"
)

if [[ -t 0 ]]; then
  docker_args+=(-i)
fi

if [[ -t 1 ]]; then
  docker_args+=(-t)
fi

append_env_file_args

if [[ -n "${DATABASE_URL+x}" ]]; then
  docker_args+=(-e "DATABASE_URL=$DATABASE_URL")
elif ! dotenv_has_key "DATABASE_URL"; then
  docker_args+=(-e "DATABASE_URL=./data/sqlite.db")
fi

if [[ -n "${UPLOAD_DIR+x}" ]]; then
  docker_args+=(-e "UPLOAD_DIR=$UPLOAD_DIR")
elif ! dotenv_has_key "UPLOAD_DIR"; then
  docker_args+=(-e "UPLOAD_DIR=/app/uploads")
fi

log "Using dependency volume $NODE_MODULES_VOLUME."
log "Starting Nuxt dev server in Docker on http://localhost:$HOST_PORT."
exec docker "${docker_args[@]}" "$IMAGE_NAME" npm run dev:host -- --host 0.0.0.0 --port "$PORT_VALUE" "$@"
