#!/bin/bash
set -e
VENDOR_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$VENDOR_DIR/repo"

if [ -d "$REPO_DIR" ]; then
  echo "[multica] already installed at $REPO_DIR"
  exit 0
fi

echo "[multica] cloning..."
git clone --depth 1 https://github.com/multica-ai/multica.git "$REPO_DIR"

echo "[multica] install complete"
