#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SSL_DIR="${ROOT_DIR}/nginx/ssl"
CERT_FILE="${SSL_DIR}/cert.pem"
KEY_FILE="${SSL_DIR}/key.pem"

mkdir -p "${SSL_DIR}"

if [[ -f "${CERT_FILE}" || -f "${KEY_FILE}" ]]; then
  echo "Certificate files already exist in ${SSL_DIR}"
  exit 0
fi

openssl req \
  -x509 \
  -nodes \
  -newkey rsa:2048 \
  -days 365 \
  -subj "/CN=localhost" \
  -keyout "${KEY_FILE}" \
  -out "${CERT_FILE}"

echo "Self-signed certificate created at:"
echo "  ${CERT_FILE}"
echo "  ${KEY_FILE}"
