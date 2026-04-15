#!/bin/bash
set -e
VENDOR_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$VENDOR_DIR/repo"

if [ -d "$REPO_DIR" ]; then
  echo "[ecc] already installed at $REPO_DIR"
  exit 0
fi

echo "[ecc] cloning..."
git clone --depth 1 https://github.com/affaan-m/everything-claude-code.git "$REPO_DIR"

echo "[ecc] install complete"
