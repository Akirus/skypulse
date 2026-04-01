#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_KEY_PATH="$ROOT_DIR/terraform/id_ed25519"
REMOTE_APP_DIR="/opt/skypulse"
REMOTE_DATA_DIR="$REMOTE_APP_DIR/data"
REMOTE_DB_PATH="$REMOTE_DATA_DIR/skypulse.db"

log() {
  printf '%s\n' "$*"
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Required command '$1' is not installed."
  fi
}

resolve_ssh_key() {
  if [[ -f "$DEFAULT_KEY_PATH" ]]; then
    SSH_KEY_PATH="$DEFAULT_KEY_PATH"
    log "Using SSH key at $SSH_KEY_PATH"
    return
  fi

  if [[ -n "${SSH_KEY_PATH:-}" ]]; then
    [[ -f "$SSH_KEY_PATH" ]] || fail "SSH_KEY_PATH is set to '$SSH_KEY_PATH' but that file does not exist."
    log "Using SSH key from SSH_KEY_PATH: $SSH_KEY_PATH"
    return
  fi

  fail "SSH key not found at $DEFAULT_KEY_PATH. Specify the key path in SSH_KEY_PATH."
}

resolve_host() {
  if [[ -n "${INSTANCE_IP:-}" ]]; then
    DEPLOY_HOST="$INSTANCE_IP"
    log "Using instance IP from INSTANCE_IP: $DEPLOY_HOST"
    return
  fi

  if [[ -n "${DEPLOY_HOST:-}" ]]; then
    log "Using instance IP from DEPLOY_HOST: $DEPLOY_HOST"
    return
  fi

  if command -v terraform >/dev/null 2>&1; then
    local terraform_output
    if terraform_output="$(terraform -chdir="$ROOT_DIR/terraform" output -raw droplet_ipv4_address 2>/dev/null)" && [[ -n "$terraform_output" ]]; then
      DEPLOY_HOST="$terraform_output"
      log "Using instance IP from terraform output 'droplet_ipv4_address': $DEPLOY_HOST"
      return
    fi
  fi

  fail "Instance IP is not set. Specify it in INSTANCE_IP or DEPLOY_HOST, or ensure terraform output 'droplet_ipv4_address' is available."
}

ssh_remote() {
  ssh \
    -i "$SSH_KEY_PATH" \
    -o StrictHostKeyChecking=accept-new \
    "root@$DEPLOY_HOST" \
    "$@"
}

scp_to_remote() {
  scp \
    -i "$SSH_KEY_PATH" \
    -o StrictHostKeyChecking=accept-new \
    "$@"
}

require_command ssh
require_command scp
require_command tar

resolve_ssh_key
resolve_host

[[ -n "${ANALYTICS_API_KEY:-}" ]] || fail "ANALYTICS_API_KEY must be set for deployment."

log "Ensuring remote directories exist at $REMOTE_APP_DIR"
ssh_remote "mkdir -p '$REMOTE_APP_DIR' '$REMOTE_DATA_DIR'"

if ssh_remote "[[ -f '$REMOTE_DB_PATH' ]]"; then
  log "Using existing remote database at $REMOTE_DB_PATH"
else
  if [[ -z "${DB_FILE_PATH:-}" ]]; then
    fail "Remote database is missing at $REMOTE_DB_PATH. Specify a local database file in DB_FILE_PATH."
  fi

  [[ -f "$DB_FILE_PATH" ]] || fail "DB_FILE_PATH is set to '$DB_FILE_PATH' but that file does not exist."

  log "Uploading database from DB_FILE_PATH: $DB_FILE_PATH"
  scp_to_remote "$DB_FILE_PATH" "root@$DEPLOY_HOST:$REMOTE_DB_PATH"
fi

log "Uploading application files to $REMOTE_APP_DIR"
tar -C "$ROOT_DIR" -czf - \
  Dockerfile \
  docker-compose.yml \
  package.json \
  package-lock.json \
  tsconfig.json \
  tsconfig.test.json \
  src \
  | ssh_remote "tar -xzf - -C '$REMOTE_APP_DIR'"

log "Writing remote environment file"
ssh_remote "cat > '$REMOTE_APP_DIR/.env' <<'EOF'
ANALYTICS_API_KEY=$ANALYTICS_API_KEY
EOF"

log "Rebuilding and restarting the application with docker compose"
ssh_remote "cd '$REMOTE_APP_DIR' && docker compose up --build -d"

log "Deployment finished successfully."
