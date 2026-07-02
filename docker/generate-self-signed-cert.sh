#!/usr/bin/env bash
# Self-signed TLS for IP-only VPS (WebRTC / microphone requires HTTPS).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="${SCRIPT_DIR}/ssl"
IP="${VPS_IP:-135.181.39.41}"

mkdir -p "$SSL_DIR"

if [[ -f "$SSL_DIR/cert.pem" && -f "$SSL_DIR/key.pem" ]]; then
  echo "Certificate already exists in $SSL_DIR"
  exit 0
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/key.pem" \
  -out "$SSL_DIR/cert.pem" \
  -subj "/CN=${IP}" \
  -addext "subjectAltName=IP:${IP},DNS:${IP}"

echo "Created self-signed cert for ${IP} in ${SSL_DIR}"
