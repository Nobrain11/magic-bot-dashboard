#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building shared libs..."
pnpm run typecheck:libs

echo "==> Building frontend..."
pnpm --filter @workspace/magic-dashboard exec \
  vite build --config vite.config.railway.ts

echo "==> Building API server..."
pnpm --filter @workspace/api-server run build

echo "==> Build complete."
