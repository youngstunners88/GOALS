#!/bin/bash
set -e
VENDOR_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$VENDOR_DIR/repo"

if [ -d "$REPO_DIR" ]; then
  echo "[socraticode] already installed at $REPO_DIR"
  exit 0
fi

echo "[socraticode] cloning..."
git clone --depth 1 https://github.com/giancarloerra/SocratiCode.git "$REPO_DIR"

echo "[socraticode] install complete"
