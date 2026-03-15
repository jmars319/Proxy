#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pnpm run check:env
pnpm run check:packages
pnpm run lint
pnpm run typecheck
pnpm run verify:web
pnpm run verify:desktop
pnpm run verify:mobile

echo "Doctor completed successfully."
