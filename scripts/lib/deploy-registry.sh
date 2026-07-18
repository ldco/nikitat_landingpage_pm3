#!/usr/bin/env bash
# ==============================================================================
# deploy-registry.sh — Shared Docker registry and SSH tunnel helper functions
# ==============================================================================
# Used by: deploy.sh, setup.sh
#
# Requires (sourced before this file):
#   scripts/lib/deploy-env.sh
#
# Requires (variables set by the calling script):
#   ROOT_DIR, SERVER_IP, DEPLOY_AUTH_MODE, DEPLOY_USER_PASSWORD,
#   DEPLOY_USER_NAME, DEPLOY_SSH_KEY, DEPLOY_KNOWN_HOSTS_FILE
#
# Requires (global state variables — declared in calling script):
#   SSH_REGISTRY_TUNNEL_PID, SSH_REGISTRY_LOCAL_PORT
#
# Requires (functions defined by the calling script):
#   fail(), log()
# ==============================================================================

ensure_remote_ssh_registry() {
  local runtime_vars_file
  local playbook_file
  local exit_code=0

  [[ "$(resolved_docker_deploy_mode)" == "ssh-registry" ]] || return 0

  ensure_remote_registry_image

  runtime_vars_file="$(mktemp)"
  playbook_file="$(mktemp)"
  render_ansible_runtime_vars_file "$runtime_vars_file" "$DEPLOY_USER_PASSWORD"

  cat >"$playbook_file" <<EOF
- name: Ensure private Docker registry is available for SSH deploys
  hosts: all
  become: true
  gather_facts: false
  collections:
    - community.docker
  vars_files:
    - "$ROOT_DIR/ansible/deploy-vars.yml"
  tasks:
    - name: Ensure private registry data directory exists
      file:
        path: "/home/{{ deploy_user }}/app/registry"
        state: directory
        owner: "{{ deploy_user }}"
        group: "{{ deploy_user }}"
        mode: "0750"

    - name: Start private Docker registry on host loopback
      community.docker.docker_container:
        name: pm-registry
        image: registry:2
        state: started
        restart_policy: unless-stopped
        published_ports:
          - "{{ ssh_registry_host }}:{{ ssh_registry_port }}:5000"
        volumes:
          - "/home/{{ deploy_user }}/app/registry:/var/lib/registry"
        networks:
          - name: 'pm-shared'
        env:
          REGISTRY_STORAGE_DELETE_ENABLED: "true"

    - name: Verify private registry catalog is reachable from the server
      uri:
        url: "http://{{ ssh_registry_host }}:{{ ssh_registry_port }}/v2/_catalog"
        method: GET
        status_code: 200
      register: registry_catalog
      retries: 5
      delay: 1
      until: registry_catalog.status == 200
      changed_when: false
EOF

  log "Ensuring private server Docker registry is running for SSH layer push."
  (cd "$ROOT_DIR" && ansible-playbook -i ansible/inventory.yml --extra-vars "@$runtime_vars_file" "$playbook_file") || exit_code=$?
  rm -f "$runtime_vars_file" "$playbook_file"
  return "$exit_code"
}

remote_has_docker_image() {
  local image_ref="$1"
  local remote_cmd
  local ssh_common_args
  local ssh_cmd

  remote_cmd="docker image inspect $(printf '%q' "$image_ref") >/dev/null 2>&1"
  ssh_common_args=(
    -o StrictHostKeyChecking=yes
    -o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS_FILE"
  )

  if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
    ssh_cmd=(ssh -i "$DEPLOY_SSH_KEY" "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$remote_cmd")
  else
    ssh_cmd=(sshpass -p "$DEPLOY_USER_PASSWORD" ssh "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$remote_cmd")
  fi

  "${ssh_cmd[@]}" >/dev/null 2>&1
}

load_docker_image_to_remote() {
  local image_ref="$1"
  local image_label="${2:-Docker image}"
  local remote_cmd
  local ssh_common_args
  local ssh_cmd

  if remote_has_docker_image "$image_ref"; then
    return 0
  fi

  if ! docker image inspect "$image_ref" >/dev/null 2>&1; then
    log "Pulling $image_label $image_ref on the operator machine for server bootstrap."
    docker pull "$image_ref"
  fi

  remote_cmd="gzip -dc | docker load"
  ssh_common_args=(
    -o StrictHostKeyChecking=yes
    -o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS_FILE"
  )

  if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
    ssh_cmd=(ssh -i "$DEPLOY_SSH_KEY" "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$remote_cmd")
  else
    ssh_cmd=(sshpass -p "$DEPLOY_USER_PASSWORD" ssh "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP" "$remote_cmd")
  fi

  log "Loading $image_label $image_ref onto the server over SSH."
  docker save "$image_ref" | gzip -c | "${ssh_cmd[@]}"
}

ensure_remote_registry_image() {
  load_docker_image_to_remote "${PM_DOCKER_SSH_REGISTRY_IMAGE:-registry:2}" "private registry image"
}

ensure_remote_traefik_image() {
  load_docker_image_to_remote "${TRAEFIK_IMAGE:-$(default_traefik_image)}" "Traefik image"
}

is_local_port_open() {
  local port="$1"
  (: >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
}

select_ssh_registry_local_port() {
  local preferred="${PM_DOCKER_SSH_REGISTRY_LOCAL_PORT:-5000}"
  local port

  if ! [[ "$preferred" =~ ^[1-9][0-9]{0,4}$ ]]; then
    fail "PM_DOCKER_SSH_REGISTRY_LOCAL_PORT must be a TCP port number."
  fi

  for ((port = preferred; port <= preferred + 50; port++)); do
    if ! is_local_port_open "$port"; then
      printf '%s' "$port"
      return 0
    fi
  done

  fail "No free local TCP port found for SSH registry tunnel starting at $preferred."
}

start_ssh_registry_tunnel() {
  local remote_port
  local ssh_common_args
  local ssh_cmd

  [[ "$(resolved_docker_deploy_mode)" == "ssh-registry" ]] || return 0

  remote_port="$(resolved_ssh_registry_port)"
  SSH_REGISTRY_LOCAL_PORT="$(select_ssh_registry_local_port)"
  ssh_common_args=(
    -N
    -L "127.0.0.1:$SSH_REGISTRY_LOCAL_PORT:$(resolved_ssh_registry_host):$remote_port"
    -o ExitOnForwardFailure=yes
    -o StrictHostKeyChecking=yes
    -o "UserKnownHostsFile=$DEPLOY_KNOWN_HOSTS_FILE"
  )

  if [[ "$DEPLOY_AUTH_MODE" == "ssh_key" ]]; then
    ssh_cmd=(ssh -i "$DEPLOY_SSH_KEY" "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP")
  else
    ssh_cmd=(sshpass -p "$DEPLOY_USER_PASSWORD" ssh "${ssh_common_args[@]}" "$DEPLOY_USER_NAME@$SERVER_IP")
  fi

  log "Opening SSH tunnel to private server registry on local port $SSH_REGISTRY_LOCAL_PORT."
  "${ssh_cmd[@]}" &
  SSH_REGISTRY_TUNNEL_PID=$!

  for _ in {1..20}; do
    if ! kill -0 "$SSH_REGISTRY_TUNNEL_PID" >/dev/null 2>&1; then
      wait "$SSH_REGISTRY_TUNNEL_PID" || true
      fail "SSH registry tunnel exited before it became ready."
    fi
    if is_local_port_open "$SSH_REGISTRY_LOCAL_PORT"; then
      return 0
    fi
    sleep 0.25
  done

  fail "SSH registry tunnel did not become ready on local port $SSH_REGISTRY_LOCAL_PORT."
}

push_docker_image_to_ssh_registry() {
  local source_ref
  local tunnel_ref
  local server_ref

  [[ "$(resolved_docker_deploy_mode)" == "ssh-registry" ]] || return 0

  source_ref="$(resolved_docker_image_ref)"
  tunnel_ref="127.0.0.1:$SSH_REGISTRY_LOCAL_PORT/$(resolved_ssh_registry_image):$(resolved_docker_image_tag)"
  server_ref="$(resolved_ssh_registry_server_image_ref)"

  log "Pushing Docker image layers through SSH tunnel to private server registry."
  docker tag "$source_ref" "$tunnel_ref"
  docker push "$tunnel_ref"
  docker tag "$source_ref" "$server_ref" >/dev/null 2>&1 || true
}
