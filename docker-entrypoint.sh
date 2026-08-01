#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/app/data}"

mkdir -p "$DATA_DIR" 2>/dev/null || true

if [ ! -d "$DATA_DIR" ]; then
  echo "ERROR: DATA_DIR does not exist and could not be created: $DATA_DIR"
  echo "Hint: Ensure the mounted volume path is valid and writable by UID 1001."
  exit 70
fi

if [ ! -w "$DATA_DIR" ]; then
  echo "ERROR: DATA_DIR is not writable: $DATA_DIR"
  echo "Hint: Fix host volume ownership/permissions for UID 1001, or set DATA_DIR to a writable path."
  exit 70
fi

exec "$@"