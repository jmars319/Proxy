#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name"
    echo "$install_hint"
    exit 1
  fi
}

echo "Checking local prerequisites..."

require_command "node" "Install Node.js 22+ before bootstrapping Proxy."
require_command "pnpm" "Install pnpm 10+ before bootstrapping Proxy."

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Node.js 22+ is required. Detected: $(node -v)"
  exit 1
fi

if command -v rustc >/dev/null 2>&1 && command -v cargo >/dev/null 2>&1; then
  echo "Rust toolchain detected: $(rustc --version)"
else
  echo "Rust toolchain not found. Desktop development will stay unavailable until Rust and Cargo are installed."
fi

if [ "$(uname -s)" = "Darwin" ] && ! xcode-select -p >/dev/null 2>&1; then
  echo "Xcode command line tools are missing. Desktop builds on macOS will fail until they are installed."
fi

echo "Installing workspace dependencies..."
cd "$ROOT_DIR"
pnpm install

echo "Bootstrap complete."
