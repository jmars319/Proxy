#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "$1"
  exit 1
}

echo "Checking environment..."

command -v node >/dev/null 2>&1 || fail "Node.js 22+ is required."
command -v pnpm >/dev/null 2>&1 || fail "pnpm 10+ is required."
command -v rustc >/dev/null 2>&1 || fail "Rust is required for the desktop app."
command -v cargo >/dev/null 2>&1 || fail "Cargo is required for the desktop app."

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  fail "Node.js 22+ is required. Detected: $(node -v)"
fi

if [ "$(uname -s)" = "Darwin" ] && ! xcode-select -p >/dev/null 2>&1; then
  fail "Xcode command line tools are required for desktop builds on macOS."
fi

echo "Node: $(node -v)"
echo "pnpm: $(pnpm -v)"
echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"
echo "Environment check passed."
