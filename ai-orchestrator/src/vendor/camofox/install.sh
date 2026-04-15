#!/bin/bash
set -e
VENDOR_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$VENDOR_DIR/repo"

if [ -d "$REPO_DIR" ]; then
  echo "[camofox] already installed at $REPO_DIR"
  exit 0
fi

echo "[camofox] cloning..."
git clone --depth 1 https://github.com/jo-inc/camofox-browser.git "$REPO_DIR"

echo "[camofox] install complete"
