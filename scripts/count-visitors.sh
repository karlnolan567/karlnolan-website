#!/usr/bin/env bash
# Count unique visitor IPs from Caddy access logs on the VPS.
#
# From your Mac (repo root):
#   ./scripts/count-visitors.sh
#
# On the VPS:
#   /opt/web_site/scripts/count-visitors.sh
#   # or: cd /opt/web_site && ./scripts/count-visitors.sh
#
# Options:
#   ./scripts/count-visitors.sh                         # www + apex
#   ./scripts/count-visitors.sh --host n8n.bespoke-ai.ie
#   ./scripts/count-visitors.sh --all                   # all hosts
set -euo pipefail

VPS_HOST="${VPS_HOST:-135.181.39.41}"
VPS_USER="${VPS_USER:-karl}"
REMOTE_DIR="${REMOTE_DIR:-/opt/web_site}"
HOST_FILTER="www.bespoke-ai.ie|bespoke-ai.ie"
ALL_HOSTS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all) ALL_HOSTS=1; shift ;;
    --host)
      HOST_FILTER="${2:?--host requires a hostname}"
      shift 2
      ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

# Shared Python: stdin = access.log JSON lines; prints unique IP count only.
PY_COUNT='
import json, os, re, sys

all_hosts = os.environ["ALL_HOSTS"] == "1"
host_filter = os.environ["HOST_FILTER"]
host_re = re.compile(r"^(?:" + host_filter + r")$")
ips = set()

for raw in sys.stdin:
    raw = raw.strip()
    if not raw:
        continue
    try:
        row = json.loads(raw)
    except json.JSONDecodeError:
        continue
    req = row.get("request") or {}
    host = req.get("host") or ""
    if not all_hosts and not host_re.match(host):
        continue
    ip = req.get("client_ip") or req.get("remote_ip") or ""
    if ip:
        ips.add(ip)

print(len(ips))
'

run_local() {
  local dir="$1"
  cd "$dir"
  if [[ ! -f docker/logs/access.log ]]; then
    echo "No access log yet at ${dir}/docker/logs/access.log" >&2
    exit 1
  fi
  export ALL_HOSTS HOST_FILTER
  docker exec web_site-caddy-1 cat /var/log/caddy/access.log | python3 -c "$PY_COUNT"
}

# Already on the VPS.
if [[ -d "${REMOTE_DIR}/docker/logs" ]]; then
  run_local "$REMOTE_DIR"
  exit 0
fi

# From a laptop: SSH in.
ssh "${VPS_USER}@${VPS_HOST}" \
  "ALL_HOSTS=$(printf %q "$ALL_HOSTS") HOST_FILTER=$(printf %q "$HOST_FILTER") REMOTE_DIR=$(printf %q "$REMOTE_DIR") bash -s" <<REMOTE
set -euo pipefail
cd "\$REMOTE_DIR"
if [[ ! -f docker/logs/access.log ]]; then
  echo "No access log yet at \${REMOTE_DIR}/docker/logs/access.log" >&2
  exit 1
fi
export ALL_HOSTS HOST_FILTER
docker exec web_site-caddy-1 cat /var/log/caddy/access.log | python3 -c $(printf %q "$PY_COUNT")
REMOTE
