#!/usr/bin/env bash
set -euo pipefail

VPS_HOST="${VPS_HOST:-135.181.39.41}"
VPS_USER="${VPS_USER:-karl}"
REMOTE_DIR="${REMOTE_DIR:-/opt/web_site}"

ssh "${VPS_USER}@${VPS_HOST}" "set -euo pipefail; cd '${REMOTE_DIR}'; git pull origin main; docker compose up -d --build; docker compose ps"
